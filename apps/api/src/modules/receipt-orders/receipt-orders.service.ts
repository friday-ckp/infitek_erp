import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryBatchSourceType,
  PurchaseOrderReceiptStatus,
  PurchaseOrderStatus,
  PurchaseOrderType,
  ReceiptOrderStatus,
  ReceiptOrderType,
  YesNo,
} from '@infitek/shared';
import { In, QueryRunner } from 'typeorm';
import { InventoryService } from '../inventory/inventory.service';
import {
  OperationLog,
  OperationLogAction,
} from '../operation-logs/entities/operation-log.entity';
import { Company } from '../master-data/companies/entities/company.entity';
import { Warehouse } from '../master-data/warehouses/entities/warehouse.entity';
import { PurchaseOrderItem } from '../purchase-orders/entities/purchase-order-item.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { ShippingDemandItem } from '../shipping-demands/entities/shipping-demand-item.entity';
import { User } from '../users/entities/user.entity';
import { CreateReceiptOrderDto } from './dto/create-receipt-order.dto';
import { QueryReceiptPurchaseOrderDto } from './dto/query-receipt-purchase-order.dto';
import { ReceiptOrderItem } from './entities/receipt-order-item.entity';
import { ReceiptOrder } from './entities/receipt-order.entity';
import { ReceiptOrdersRepository } from './receipt-orders.repository';

const MAX_RECEIPT_ORDER_CODE_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 25;

interface ReceiptWarehouseSnapshot {
  id: number;
  name: string;
}

@Injectable()
export class ReceiptOrdersService {
  constructor(
    private readonly receiptOrdersRepository: ReceiptOrdersRepository,
    private readonly inventoryService: InventoryService,
  ) {}

  async findById(id: number): Promise<ReceiptOrder> {
    const receiptOrder = await this.receiptOrdersRepository.findById(id);
    if (!receiptOrder) {
      throw new NotFoundException('收货入库单不存在');
    }
    return receiptOrder;
  }

  async getPurchaseOrderOptions(query: QueryReceiptPurchaseOrderDto) {
    const rows =
      await this.receiptOrdersRepository.findPurchaseOrderOptions(query);
    return rows.map((row) => ({
      id: Number(row.id),
      poCode: row.poCode,
      supplierName: row.supplierName,
      status: row.status as PurchaseOrderStatus,
      receiptStatus: row.receiptStatus as PurchaseOrderReceiptStatus,
      shippingDemandId:
        row.shippingDemandId == null ? null : Number(row.shippingDemandId),
      shippingDemandCode: row.shippingDemandCode,
      remainingTotalQuantity: Number(row.remainingTotalQuantity ?? 0),
    }));
  }

  async getCreatePrefill(purchaseOrderId: number) {
    const queryRunner = this.receiptOrdersRepository.createQueryRunner();
    try {
      await queryRunner.connect();
      const purchaseOrder = await this.findPurchaseOrderForReceipt(
        queryRunner,
        purchaseOrderId,
      );
      return {
        purchaseOrder: {
          id: Number(purchaseOrder.id),
          poCode: purchaseOrder.poCode,
          status: purchaseOrder.status,
          receiptStatus: purchaseOrder.receiptStatus,
          supplierId: Number(purchaseOrder.supplierId),
          supplierName: purchaseOrder.supplierName,
          shippingDemandId:
            purchaseOrder.shippingDemandId == null
              ? null
              : Number(purchaseOrder.shippingDemandId),
          shippingDemandCode: purchaseOrder.shippingDemandCode,
          purchaseCompanyId:
            purchaseOrder.purchaseCompanyId == null
              ? null
              : Number(purchaseOrder.purchaseCompanyId),
          purchaseCompanyName: purchaseOrder.purchaseCompanyName,
          totalQuantity: Number(purchaseOrder.totalQuantity ?? 0),
          receivedTotalQuantity: Number(
            purchaseOrder.receivedTotalQuantity ?? 0,
          ),
          remainingTotalQuantity: this.sumRemainingQuantity(purchaseOrder.items ?? []),
        },
        items: this.buildPrefillItems(purchaseOrder.items ?? []),
      };
    } finally {
      await queryRunner.release();
    }
  }

  async create(dto: CreateReceiptOrderDto, operator?: string) {
    const existing = await this.receiptOrdersRepository.findBySourceActionKey(
      dto.requestKey,
    );
    if (existing) {
      return this.findById(Number(existing.id));
    }

    const receiptOrderId = await this.executeWithReceiptOrderCodeRetry(
      async (queryRunner) => {
        const existingInTx =
          await queryRunner.manager.getRepository(ReceiptOrder).findOne({
            where: { sourceActionKey: dto.requestKey },
          });
        if (existingInTx) {
          return Number(existingInTx.id);
        }

        const receiptOrder = await this.createInTransaction(
          queryRunner,
          dto,
          operator,
        );
        return Number(receiptOrder.id);
      },
    );

    return this.findById(receiptOrderId);
  }

  private async createInTransaction(
    queryRunner: QueryRunner,
    dto: CreateReceiptOrderDto,
    operator?: string,
  ): Promise<ReceiptOrder> {
    const purchaseOrder = await this.findPurchaseOrderForReceipt(
      queryRunner,
      dto.purchaseOrderId,
      true,
    );
    const receiptOrderRepo = queryRunner.manager.getRepository(ReceiptOrder);
    const receiptOrderItemRepo = queryRunner.manager.getRepository(ReceiptOrderItem);

    const oldStatus = purchaseOrder.status;
    const oldReceiptStatus = purchaseOrder.receiptStatus;
    const oldReceivedTotalQuantity = Number(
      purchaseOrder.receivedTotalQuantity ?? 0,
    );

    const receiptLines = dto.items.filter(
      (item) => Number(item.receivedQuantity ?? 0) > 0,
    );
    if (!receiptLines.length) {
      throw new BadRequestException({
        code: 'RECEIPT_ORDER_ITEMS_EMPTY',
        message: '至少需要录入一条入库数量大于 0 的明细',
      });
    }

    const purchaseOrderItemById = new Map(
      (purchaseOrder.items ?? []).map((item) => [Number(item.id), item]),
    );
    const warehouseIds = [
      ...new Set(
        receiptLines.map((item) =>
          Number(item.warehouseId ?? dto.warehouseId),
        ),
      ),
    ];
    const warehouseSnapshots = await this.resolveWarehouses(
      queryRunner,
      warehouseIds,
    );
    const receiver = await this.resolveReceiver(queryRunner, dto.receiverId);
    const purchaseCompany = await this.resolvePurchaseCompany(
      queryRunner,
      dto.purchaseCompanyId ?? purchaseOrder.purchaseCompanyId ?? undefined,
    );
    const defaultWarehouse = warehouseSnapshots.get(Number(dto.warehouseId));

    if (!defaultWarehouse) {
      throw new BadRequestException({
        code: 'RECEIPT_ORDER_WAREHOUSE_NOT_FOUND',
        message: '默认入库仓库不存在',
      });
    }

    const preparedItems = receiptLines.map((item) => {
      const purchaseOrderItem = purchaseOrderItemById.get(
        Number(item.purchaseOrderItemId),
      );
      if (!purchaseOrderItem) {
        throw new BadRequestException({
          code: 'RECEIPT_ORDER_ITEM_NOT_IN_PURCHASE_ORDER',
          message: '收货明细必须来自当前采购订单',
        });
      }

      const remainingQuantity =
        Number(purchaseOrderItem.quantity ?? 0) -
        Number(purchaseOrderItem.receivedQuantity ?? 0);
      if (remainingQuantity <= 0) {
        throw new BadRequestException({
          code: 'RECEIPT_ORDER_ITEM_FULLY_RECEIVED',
          message: `${purchaseOrderItem.skuCode} 已经全部收货`,
        });
      }

      if (!Number.isInteger(item.receivedQuantity) || item.receivedQuantity < 0) {
        throw new BadRequestException({
          code: 'RECEIPT_ORDER_QUANTITY_INVALID',
          message: `${purchaseOrderItem.skuCode} 的入库数量必须为 0 或正整数`,
        });
      }
      if (item.receivedQuantity > remainingQuantity) {
        throw new BadRequestException({
          code: 'RECEIPT_ORDER_QUANTITY_EXCEEDS_REMAINING',
          message: `${purchaseOrderItem.skuCode} 本次入库数量不能超过剩余可收货数量 ${remainingQuantity}`,
        });
      }

      const warehouseId = Number(item.warehouseId ?? dto.warehouseId);
      const warehouse = warehouseSnapshots.get(warehouseId);
      if (!warehouse) {
        throw new BadRequestException({
          code: 'RECEIPT_ORDER_WAREHOUSE_NOT_FOUND',
          message: `${purchaseOrderItem.skuCode} 的目标仓库不存在`,
        });
      }

      return {
        purchaseOrderItem,
        warehouse,
        receivedQuantity: item.receivedQuantity,
        qcImageKeys: item.qcImageKeys ?? [],
      };
    });

    const receiptCode = await this.generateReceiptCode(queryRunner);
    const totalQuantity = preparedItems.reduce(
      (sum, item) => sum + item.receivedQuantity,
      0,
    );
    const totalAmount = preparedItems.reduce(
      (sum, item) =>
        sum +
        item.receivedQuantity * Number(item.purchaseOrderItem.unitPrice ?? 0),
      0,
    );

    const receiptOrder = await receiptOrderRepo.save(
      receiptOrderRepo.create({
        receiptCode,
        purchaseOrderId: Number(purchaseOrder.id),
        purchaseOrderCode: purchaseOrder.poCode,
        receiptType: dto.receiptType ?? ReceiptOrderType.PURCHASE_RECEIPT,
        status: ReceiptOrderStatus.CONFIRMED,
        warehouseId: Number(defaultWarehouse.id),
        warehouseName: defaultWarehouse.name,
        receiptDate: dto.receiptDate,
        receiverId: Number(receiver.id),
        receiverName: receiver.name,
        shippingDemandId:
          purchaseOrder.shippingDemandId == null
            ? null
            : Number(purchaseOrder.shippingDemandId),
        shippingDemandCode: purchaseOrder.shippingDemandCode,
        purchaseCompanyId:
          purchaseCompany == null ? null : Number(purchaseCompany.id),
        purchaseCompanyName: purchaseCompany?.nameCn ?? null,
        totalQuantity,
        totalAmount: this.decimal(totalAmount),
        remark: dto.remark?.trim() || null,
        inventoryNote: dto.inventoryNote?.trim() || null,
        sourceActionKey: dto.requestKey,
        createdBy: operator,
        updatedBy: operator,
      }),
    );

    const savedReceiptItems: ReceiptOrderItem[] = [];
    for (const preparedItem of preparedItems) {
      const savedReceiptItem = await receiptOrderItemRepo.save(
        receiptOrderItemRepo.create({
          receiptOrderId: Number(receiptOrder.id),
          purchaseOrderId: Number(purchaseOrder.id),
          purchaseOrderItemId: Number(preparedItem.purchaseOrderItem.id),
          shippingDemandItemId:
            preparedItem.purchaseOrderItem.shippingDemandItemId == null
              ? null
              : Number(preparedItem.purchaseOrderItem.shippingDemandItemId),
          skuId: Number(preparedItem.purchaseOrderItem.skuId),
          skuCode: preparedItem.purchaseOrderItem.skuCode,
          productName:
            preparedItem.purchaseOrderItem.productNameCn ??
            preparedItem.purchaseOrderItem.productNameEn,
          productCategoryName:
            preparedItem.purchaseOrderItem.productType ??
            preparedItem.purchaseOrderItem.spuName,
          receivedQuantity: preparedItem.receivedQuantity,
          qcImageKeys:
            preparedItem.qcImageKeys.length > 0 ? preparedItem.qcImageKeys : null,
          unitPrice: preparedItem.purchaseOrderItem.unitPrice,
          warehouseId: Number(preparedItem.warehouse.id),
          warehouseName: preparedItem.warehouse.name,
          inventoryBatchId: null,
          createdBy: operator,
          updatedBy: operator,
        }),
      );

      const inventoryResult = await this.inventoryService.increaseStockInTransaction(
        queryRunner,
        {
          skuId: Number(preparedItem.purchaseOrderItem.skuId),
          warehouseId: Number(preparedItem.warehouse.id),
          quantity: preparedItem.receivedQuantity,
          sourceType: InventoryBatchSourceType.PURCHASE_RECEIPT,
          sourceDocumentId: Number(receiptOrder.id),
          sourceDocumentItemId: Number(savedReceiptItem.id),
          sourceActionKey: `receipt:${dto.requestKey}:item:${savedReceiptItem.id}`,
          receiptDate: dto.receiptDate,
          operator,
        },
      );

      savedReceiptItem.inventoryBatchId = Number(
        inventoryResult.batches[0]?.id ?? 0,
      );
      if (operator !== undefined) {
        savedReceiptItem.updatedBy = operator;
      }
      savedReceiptItems.push(await receiptOrderItemRepo.save(savedReceiptItem));

      preparedItem.purchaseOrderItem.receivedQuantity =
        Number(preparedItem.purchaseOrderItem.receivedQuantity ?? 0) +
        preparedItem.receivedQuantity;
      preparedItem.purchaseOrderItem.isFullyReceived =
        preparedItem.purchaseOrderItem.receivedQuantity >=
        Number(preparedItem.purchaseOrderItem.quantity ?? 0)
          ? YesNo.YES
          : YesNo.NO;
      if (operator !== undefined) {
        preparedItem.purchaseOrderItem.updatedBy = operator;
      }
    }

    const purchaseOrderItemRepo =
      queryRunner.manager.getRepository(PurchaseOrderItem);
    purchaseOrder.items = await purchaseOrderItemRepo.save(purchaseOrder.items ?? []);
    await this.refreshShippingDemandReceivedQuantity(
      queryRunner,
      (purchaseOrder.items ?? [])
        .map((item) =>
          item.shippingDemandItemId == null
            ? null
            : Number(item.shippingDemandItemId),
        )
        .filter((itemId): itemId is number => itemId != null),
      operator,
    );

    const aggregated = this.aggregatePurchaseOrderReceipt(
      purchaseOrder.items ?? [],
    );
    purchaseOrder.receivedTotalQuantity = aggregated.receivedTotalQuantity;
    purchaseOrder.receiptStatus = aggregated.receiptStatus;
    purchaseOrder.status = aggregated.status;
    if (operator !== undefined) {
      purchaseOrder.updatedBy = operator;
    }
    await queryRunner.manager.getRepository(PurchaseOrder).save(purchaseOrder);

    await this.writeOperationLogs(
      queryRunner,
      receiptOrder,
      purchaseOrder,
      savedReceiptItems,
      {
        oldStatus,
        oldReceiptStatus,
        oldReceivedTotalQuantity,
      },
      operator,
    );

    receiptOrder.items = savedReceiptItems;
    return receiptOrder;
  }

  private async findPurchaseOrderForReceipt(
    queryRunner: QueryRunner,
    purchaseOrderId: number,
    lock = false,
  ): Promise<PurchaseOrder> {
    const qb = queryRunner.manager
      .getRepository(PurchaseOrder)
      .createQueryBuilder('purchaseOrder')
      .leftJoinAndSelect('purchaseOrder.items', 'items')
      .leftJoinAndSelect('purchaseOrder.receiptOrders', 'receiptOrders')
      .where('purchaseOrder.id = :purchaseOrderId', { purchaseOrderId })
      .orderBy('items.id', 'ASC')
      .addOrderBy('receiptOrders.created_at', 'DESC')
      .addOrderBy('receiptOrders.id', 'DESC');

    if (lock) {
      qb.setLock('pessimistic_write');
    }

    const purchaseOrder = await qb.getOne();
    if (!purchaseOrder) {
      throw new NotFoundException('采购订单不存在');
    }
    if (
      purchaseOrder.status !== PurchaseOrderStatus.PENDING_RECEIPT &&
      purchaseOrder.status !== PurchaseOrderStatus.PARTIALLY_RECEIVED
    ) {
      throw new BadRequestException({
        code: 'PURCHASE_ORDER_RECEIPT_STATUS_INVALID',
        message: '只有待收货或部分收货的采购订单可以创建收货入库单',
      });
    }
    if (!this.buildPrefillItems(purchaseOrder.items ?? []).length) {
      throw new BadRequestException({
        code: 'PURCHASE_ORDER_NO_REMAINING_RECEIPT_QUANTITY',
        message: '当前采购订单没有可收货的剩余数量',
      });
    }
    return purchaseOrder;
  }

  private buildPrefillItems(items: PurchaseOrderItem[]) {
    return items
      .map((item) => {
        const quantity = Number(item.quantity ?? 0);
        const receivedQuantity = Number(item.receivedQuantity ?? 0);
        const remainingQuantity = Math.max(0, quantity - receivedQuantity);
        return {
          purchaseOrderItemId: Number(item.id),
          shippingDemandItemId:
            item.shippingDemandItemId == null
              ? null
              : Number(item.shippingDemandItemId),
          skuId: Number(item.skuId),
          skuCode: item.skuCode,
          productName:
            item.productNameCn ?? item.productNameEn ?? item.skuCode,
          productCategoryName: item.productType ?? item.spuName,
          quantity,
          receivedQuantity,
          remainingQuantity,
          unitPrice: Number(item.unitPrice ?? 0),
          qcImageKeys: [] as string[],
        };
      })
      .filter((item) => item.remainingQuantity > 0);
  }

  private sumRemainingQuantity(items: PurchaseOrderItem[]) {
    return items.reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          Number(item.quantity ?? 0) - Number(item.receivedQuantity ?? 0),
        ),
      0,
    );
  }

  private async resolveWarehouses(
    queryRunner: QueryRunner,
    warehouseIds: number[],
  ): Promise<Map<number, ReceiptWarehouseSnapshot>> {
    const warehouses = await queryRunner.manager.getRepository(Warehouse).find({
      where: { id: In(warehouseIds) },
    });
    return new Map(
      warehouses.map((warehouse) => [
        Number(warehouse.id),
        {
          id: Number(warehouse.id),
          name: warehouse.name,
        },
      ]),
    );
  }

  private async resolveReceiver(queryRunner: QueryRunner, receiverId: number) {
    const receiver = await queryRunner.manager.getRepository(User).findOne({
      where: { id: receiverId },
    });
    if (!receiver) {
      throw new BadRequestException({
        code: 'RECEIPT_ORDER_RECEIVER_NOT_FOUND',
        message: '入库员不存在',
      });
    }
    return receiver;
  }

  private async resolvePurchaseCompany(
    queryRunner: QueryRunner,
    purchaseCompanyId?: number,
  ): Promise<Company | null> {
    if (!purchaseCompanyId) return null;
    const company = await queryRunner.manager.getRepository(Company).findOne({
      where: { id: purchaseCompanyId },
    });
    if (!company) {
      throw new BadRequestException({
        code: 'RECEIPT_ORDER_COMPANY_NOT_FOUND',
        message: '采购主体不存在',
      });
    }
    return company;
  }

  private aggregatePurchaseOrderReceipt(items: PurchaseOrderItem[]) {
    const receivedTotalQuantity = items.reduce(
      (sum, item) => sum + Number(item.receivedQuantity ?? 0),
      0,
    );
    const allFullyReceived =
      items.length > 0 &&
      items.every(
        (item) =>
          Number(item.receivedQuantity ?? 0) >= Number(item.quantity ?? 0),
      );
    const anyReceived = items.some(
      (item) => Number(item.receivedQuantity ?? 0) > 0,
    );

    return {
      receivedTotalQuantity,
      receiptStatus: allFullyReceived
        ? PurchaseOrderReceiptStatus.RECEIVED
        : anyReceived
          ? PurchaseOrderReceiptStatus.PARTIALLY_RECEIVED
          : PurchaseOrderReceiptStatus.NOT_RECEIVED,
      status: allFullyReceived
        ? PurchaseOrderStatus.RECEIVED
        : anyReceived
          ? PurchaseOrderStatus.PARTIALLY_RECEIVED
          : PurchaseOrderStatus.PENDING_RECEIPT,
    };
  }

  private async refreshShippingDemandReceivedQuantity(
    queryRunner: QueryRunner,
    shippingDemandItemIds: number[],
    operator?: string,
  ): Promise<void> {
    if (!shippingDemandItemIds.length) return;

    const rows = await queryRunner.manager
      .getRepository(PurchaseOrderItem)
      .createQueryBuilder('item')
      .innerJoin('item.purchaseOrder', 'purchaseOrder')
      .select('item.shipping_demand_item_id', 'shippingDemandItemId')
      .addSelect('SUM(item.received_quantity)', 'receivedQuantity')
      .where('item.shipping_demand_item_id IN (:...shippingDemandItemIds)', {
        shippingDemandItemIds,
      })
      .andWhere('purchaseOrder.order_type = :orderType', {
        orderType: PurchaseOrderType.REQUISITION,
      })
      .andWhere('purchaseOrder.status != :cancelled', {
        cancelled: PurchaseOrderStatus.CANCELLED,
      })
      .groupBy('item.shipping_demand_item_id')
      .getRawMany<{
        shippingDemandItemId: string;
        receivedQuantity: string;
      }>();

    const receivedByItemId = new Map(
      rows.map((row) => [
        Number(row.shippingDemandItemId),
        Number(row.receivedQuantity ?? 0),
      ]),
    );

    const shippingDemandItemRepo =
      queryRunner.manager.getRepository(ShippingDemandItem);
    const items = await shippingDemandItemRepo.find({
      where: { id: In(shippingDemandItemIds) },
    });

    for (const item of items) {
      item.receivedQuantity = receivedByItemId.get(Number(item.id)) ?? 0;
      if (operator !== undefined) {
        item.updatedBy = operator;
      }
    }

    await shippingDemandItemRepo.save(items);
  }

  private async writeOperationLogs(
    queryRunner: QueryRunner,
    receiptOrder: ReceiptOrder,
    purchaseOrder: PurchaseOrder,
    receiptItems: ReceiptOrderItem[],
    previous: {
      oldStatus: PurchaseOrderStatus;
      oldReceiptStatus: PurchaseOrderReceiptStatus;
      oldReceivedTotalQuantity: number;
    },
    operator?: string,
  ) {
    const operationLogRepo = queryRunner.manager.getRepository(OperationLog);

    await operationLogRepo.save(
      operationLogRepo.create({
        operator: operator ?? 'system',
        operatorId: null,
        action: OperationLogAction.CREATE,
        resourceType: 'receipt-orders',
        resourceId: String(receiptOrder.id),
        resourcePath: '/api/receipt-orders',
        requestSummary: {
          sourceAction: 'confirm_purchase_receipt',
          receiptCode: receiptOrder.receiptCode,
          purchaseOrderId: Number(receiptOrder.purchaseOrderId),
          purchaseOrderCode: receiptOrder.purchaseOrderCode,
          totalQuantity: receiptOrder.totalQuantity,
          totalAmount: receiptOrder.totalAmount,
          itemCount: receiptItems.length,
        },
        changeSummary: [
          {
            field: 'status',
            fieldLabel: '收货入库单状态',
            oldValue: null,
            newValue: ReceiptOrderStatus.CONFIRMED,
          },
        ],
      }),
    );

    const changeSummary: Array<{
      field: string;
      fieldLabel: string;
      oldValue: unknown;
      newValue: unknown;
    }> = [];
    if (previous.oldStatus !== purchaseOrder.status) {
      changeSummary.push({
        field: 'status',
        fieldLabel: '采购订单状态',
        oldValue: previous.oldStatus,
        newValue: purchaseOrder.status,
      });
    }
    if (previous.oldReceiptStatus !== purchaseOrder.receiptStatus) {
      changeSummary.push({
        field: 'receiptStatus',
        fieldLabel: '入库状态',
        oldValue: previous.oldReceiptStatus,
        newValue: purchaseOrder.receiptStatus,
      });
    }
    if (
      previous.oldReceivedTotalQuantity !==
      Number(purchaseOrder.receivedTotalQuantity ?? 0)
    ) {
      changeSummary.push({
        field: 'receivedTotalQuantity',
        fieldLabel: '已入库总数',
        oldValue: previous.oldReceivedTotalQuantity,
        newValue: Number(purchaseOrder.receivedTotalQuantity ?? 0),
      });
    }

    await operationLogRepo.save(
      operationLogRepo.create({
        operator: operator ?? 'system',
        operatorId: null,
        action: OperationLogAction.UPDATE,
        resourceType: 'purchase-orders',
        resourceId: String(purchaseOrder.id),
        resourcePath: `/api/receipt-orders/${receiptOrder.id}`,
        requestSummary: {
          sourceAction: 'purchase_receipt_confirmed',
          receiptOrderId: Number(receiptOrder.id),
          receiptCode: receiptOrder.receiptCode,
          totalQuantity: receiptOrder.totalQuantity,
          totalAmount: receiptOrder.totalAmount,
        },
        changeSummary,
      }),
    );
  }

  private async generateReceiptCode(queryRunner: QueryRunner): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const prefix = `RKDH${year}${month}${day}`;
    const latest = await queryRunner.manager
      .getRepository(ReceiptOrder)
      .createQueryBuilder('receiptOrder')
      .setLock('pessimistic_write')
      .where('receiptOrder.receipt_code LIKE :prefix', {
        prefix: `${prefix}%`,
      })
      .orderBy('receiptOrder.receipt_code', 'DESC')
      .getOne();
    const lastNumber = latest?.receiptCode
      ? Number(latest.receiptCode.slice(prefix.length))
      : 0;
    return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`;
  }

  private decimal(value: number): string {
    return value.toFixed(2);
  }

  private async executeWithReceiptOrderCodeRetry<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    let retryCount = 0;
    while (true) {
      const queryRunner = this.receiptOrdersRepository.createQueryRunner();
      let transactionStarted = false;

      try {
        await queryRunner.connect();
        await queryRunner.startTransaction();
        transactionStarted = true;
        const result = await operation(queryRunner);
        await queryRunner.commitTransaction();
        return result;
      } catch (error) {
        if (transactionStarted) {
          await queryRunner.rollbackTransaction();
        }
        if (
          this.isRetryableConcurrencyError(error) &&
          retryCount < MAX_RECEIPT_ORDER_CODE_RETRIES
        ) {
          retryCount += 1;
          await this.delay(INITIAL_RETRY_DELAY_MS * 2 ** (retryCount - 1));
          continue;
        }
        if (this.isRetryableConcurrencyError(error)) {
          throw new ConflictException({
            code: 'CONCURRENT_UPDATE',
            message: '收货入库并发更新失败，请稍后重试',
          });
        }
        throw error;
      } finally {
        await queryRunner.release();
      }
    }
  }

  private isRetryableConcurrencyError(error: unknown): boolean {
    const maybeError = error as { code?: string; errno?: number };
    return (
      maybeError?.code === 'ER_LOCK_DEADLOCK' ||
      maybeError?.errno === 1213 ||
      maybeError?.code === 'ER_DUP_ENTRY' ||
      maybeError?.errno === 1062
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
