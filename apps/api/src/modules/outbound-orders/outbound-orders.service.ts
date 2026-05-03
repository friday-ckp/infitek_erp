import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LogisticsOrderStatus,
  OutboundOrderStatus,
  OutboundOrderType,
  SalesOrderStatus,
  ShippingDemandAllocationStatus,
  ShippingDemandStatus,
} from '@infitek/shared';
import { In, QueryRunner, Repository } from 'typeorm';
import { InventoryService } from '../inventory/inventory.service';
import { Company } from '../master-data/companies/entities/company.entity';
import { PurchaseOrderItem } from '../purchase-orders/entities/purchase-order-item.entity';
import { User } from '../users/entities/user.entity';
import { OperationLog, OperationLogAction } from '../operation-logs/entities/operation-log.entity';
import { Warehouse } from '../master-data/warehouses/entities/warehouse.entity';
import { LogisticsOrderItem } from '../logistics-orders/entities/logistics-order-item.entity';
import { LogisticsOrder } from '../logistics-orders/entities/logistics-order.entity';
import { SalesOrderItem } from '../sales-orders/entities/sales-order-item.entity';
import { SalesOrder } from '../sales-orders/entities/sales-order.entity';
import { ShippingDemandInventoryAllocation } from '../shipping-demands/entities/shipping-demand-inventory-allocation.entity';
import { ShippingDemandItem } from '../shipping-demands/entities/shipping-demand-item.entity';
import { ShippingDemand } from '../shipping-demands/entities/shipping-demand.entity';
import { CreateOutboundOrderDto } from './dto/create-outbound-order.dto';
import { OutboundOrdersRepository } from './outbound-orders.repository';
import { OutboundAllocationConsumption } from './entities/outbound-allocation-consumption.entity';
import { OutboundOrderItem } from './entities/outbound-order-item.entity';
import { OutboundOrder } from './entities/outbound-order.entity';

const MAX_OUTBOUND_ORDER_CODE_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 25;

export interface OutboundPrefillItem {
  logisticsOrderItemId: number;
  shippingDemandItemId: number;
  salesOrderItemId: number;
  skuId: number;
  skuCode: string;
  productNameCn: string | null;
  productNameEn: string | null;
  unitName: string | null;
  purchaseSubject: string | null;
  salesUnitPrice: string | null;
  costUnitPrice: string | null;
  plannedQuantity: number;
  outboundQuantity: number;
  remainingQuantity: number;
}

interface PreparedOutboundLine {
  logisticsItem: LogisticsOrderItem;
  demandItem: ShippingDemandItem;
  requestedQuantity: number;
  remainingQuantity: number;
  warehouseId: number;
  warehouseName: string;
  salesUnitPrice: number;
  costUnitPrice: number;
  allocations: Array<{ allocation: ShippingDemandInventoryAllocation; quantity: number }>;
}

export interface OutboundOrderCreatePrefillResult {
  logisticsOrder: {
    id: number;
    orderCode: string;
    shippingDemandId: number;
    shippingDemandCode: string;
    salesOrderId: number;
    salesOrderCode: string;
    status: LogisticsOrderStatus;
    logisticsProviderName: string;
    transportationMethod: LogisticsOrder['transportationMethod'];
  };
  items: OutboundPrefillItem[];
}

interface AllocationConsumptionResult {
  allocationId: number;
  inventoryBatchId: number;
  consumedQuantity: number;
}

interface ShippingDemandStatusChange {
  demand: ShippingDemand;
  oldStatus: ShippingDemandStatus;
}

interface SalesOrderStatusChange {
  order: SalesOrder;
  oldStatus: SalesOrderStatus;
}

@Injectable()
export class OutboundOrdersService {
  constructor(
    private readonly outboundOrdersRepository: OutboundOrdersRepository,
    private readonly inventoryService: InventoryService,
  ) {}

  async getCreatePrefill(
    logisticsOrderId: number,
  ): Promise<OutboundOrderCreatePrefillResult> {
    const queryRunner = this.outboundOrdersRepository.createQueryRunner();
    try {
      await queryRunner.connect();
      const logisticsOrder = await this.findLogisticsOrderForOutbound(
        queryRunner,
        logisticsOrderId,
      );
      const demandItemById = await this.findShippingDemandItemsById(
        queryRunner,
        (logisticsOrder.items ?? []).map((item) =>
          Number(item.shippingDemandItemId),
        ),
      );
      const items = this.buildPrefillItems(
        logisticsOrder.items ?? [],
        demandItemById,
        await this.findSalesPriceBySalesOrderItemId(
          queryRunner,
          (logisticsOrder.items ?? []).map((item) =>
            Number(item.salesOrderItemId),
          ),
        ),
        await this.findPurchaseCostByDemandItemId(
          queryRunner,
          (logisticsOrder.items ?? []).map((item) =>
            Number(item.shippingDemandItemId),
          ),
        ),
      );
      if (!items.length) {
        throw new BadRequestException({
          code: 'OUTBOUND_ORDER_NO_REMAINING_ITEMS',
          message: '当前物流单没有可继续出库的货物明细',
        });
      }

      return {
        logisticsOrder: {
          id: Number(logisticsOrder.id),
          orderCode: logisticsOrder.orderCode,
          shippingDemandId: Number(logisticsOrder.shippingDemandId),
          shippingDemandCode: logisticsOrder.shippingDemandCode,
          salesOrderId: Number(logisticsOrder.salesOrderId),
          salesOrderCode: logisticsOrder.salesOrderCode,
          status: logisticsOrder.status,
          logisticsProviderName: logisticsOrder.logisticsProviderName,
          transportationMethod: logisticsOrder.transportationMethod,
        },
        items,
      };
    } finally {
      await queryRunner.release();
    }
  }

  async create(dto: CreateOutboundOrderDto, operator?: string) {
    const existing = await this.outboundOrdersRepository.findBySourceActionKey(
      dto.requestKey,
    );
    if (existing) {
      return this.findById(Number(existing.id));
    }

    const outboundOrderId = await this.executeWithOutboundOrderCodeRetry(
      async (queryRunner) => {
        const existingInTx =
          await queryRunner.manager.getRepository(OutboundOrder).findOne({
            where: { sourceActionKey: dto.requestKey },
          });
        if (existingInTx) {
          return Number(existingInTx.id);
        }

        const outboundOrder = await this.createInTransaction(
          queryRunner,
          dto,
          operator,
        );
        return Number(outboundOrder.id);
      },
    );

    return this.findById(outboundOrderId);
  }

  async findById(id: number): Promise<OutboundOrder> {
    const outboundOrder = await this.outboundOrdersRepository.findById(id);
    if (!outboundOrder) {
      throw new NotFoundException('发货出库单不存在');
    }
    return outboundOrder;
  }

  private buildPrefillItems(
    items: LogisticsOrderItem[],
    demandItemById: Map<number, ShippingDemandItem>,
    salesPriceBySalesOrderItemId: Map<number, string | null>,
    purchaseCostByDemandItemId: Map<number, string | null>,
  ): OutboundPrefillItem[] {
    return items
      .map((item) => {
        const plannedQuantity = Number(item.plannedQuantity ?? 0);
        const outboundQuantity = Number(item.outboundQuantity ?? 0);
        const demandItem = demandItemById.get(Number(item.shippingDemandItemId));
        return {
          logisticsOrderItemId: Number(item.id),
          shippingDemandItemId: Number(item.shippingDemandItemId),
          salesOrderItemId: Number(item.salesOrderItemId),
          skuId: Number(item.skuId),
          skuCode: item.skuCode,
          productNameCn: item.productNameCn ?? null,
          productNameEn: item.productNameEn ?? null,
          unitName: item.unitName ?? null,
          purchaseSubject: demandItem?.purchaseSupplierName ?? null,
          salesUnitPrice:
            salesPriceBySalesOrderItemId.get(Number(item.salesOrderItemId)) ??
            demandItem?.unitPrice ??
            null,
          costUnitPrice:
            purchaseCostByDemandItemId.get(Number(item.shippingDemandItemId)) ??
            null,
          plannedQuantity,
          outboundQuantity,
          remainingQuantity: Math.max(0, plannedQuantity - outboundQuantity),
        };
      })
      .filter((item) => item.remainingQuantity > 0)
      .sort((a, b) => a.logisticsOrderItemId - b.logisticsOrderItemId);
  }

  private async findShippingDemandItemsById(
    queryRunner: QueryRunner,
    shippingDemandItemIds: number[],
  ): Promise<Map<number, ShippingDemandItem>> {
    if (!shippingDemandItemIds.length) {
      return new Map();
    }

    const items = await queryRunner.manager.getRepository(ShippingDemandItem).find({
      where: { id: In(shippingDemandItemIds) },
    });

    return new Map(items.map((item) => [Number(item.id), item]));
  }

  private async findSalesPriceBySalesOrderItemId(
    queryRunner: QueryRunner,
    salesOrderItemIds: number[],
  ): Promise<Map<number, string | null>> {
    if (!salesOrderItemIds.length) {
      return new Map();
    }

    const items = await queryRunner.manager.getRepository(SalesOrderItem).find({
      where: { id: In(salesOrderItemIds) },
    });

    return new Map(
      items.map((item) => [Number(item.id), item.unitPrice ?? null]),
    );
  }

  private async findPurchaseCostByDemandItemId(
    queryRunner: QueryRunner,
    shippingDemandItemIds: number[],
  ): Promise<Map<number, string | null>> {
    if (!shippingDemandItemIds.length) {
      return new Map();
    }

    const items = await queryRunner.manager
      .getRepository(PurchaseOrderItem)
      .createQueryBuilder('item')
      .innerJoin('item.purchaseOrder', 'purchaseOrder')
      .where('item.shipping_demand_item_id IN (:...shippingDemandItemIds)', {
        shippingDemandItemIds,
      })
      .orderBy('purchaseOrder.created_at', 'DESC')
      .addOrderBy('item.id', 'DESC')
      .getMany();

    const costByDemandItemId = new Map<number, string | null>();
    for (const item of items) {
      const demandItemId = Number(item.shippingDemandItemId);
      if (!demandItemId || costByDemandItemId.has(demandItemId)) {
        continue;
      }
      costByDemandItemId.set(demandItemId, item.unitPrice ?? null);
    }

    return costByDemandItemId;
  }

  private async createInTransaction(
    queryRunner: QueryRunner,
    dto: CreateOutboundOrderDto,
    operator?: string,
  ): Promise<OutboundOrder> {
    const logisticsOrder = await this.findLogisticsOrderForOutbound(
      queryRunner,
      dto.logisticsOrderId,
      true,
    );
    const lines = await this.prepareOutboundLines(queryRunner, logisticsOrder, dto);

    const outboundOrderRepo = queryRunner.manager.getRepository(OutboundOrder);
    const outboundItemRepo = queryRunner.manager.getRepository(OutboundOrderItem);
    const consumptionRepo = queryRunner.manager.getRepository(
      OutboundAllocationConsumption,
    );
    const outboundUser = await this.resolveOutboundUser(
      queryRunner,
      Number(dto.outboundUserId),
    );
    const salesCompany = await this.resolveSalesCompany(
      queryRunner,
      Number(dto.salesCompanyId),
    );

    const outboundCode = await this.generateOutboundCode(queryRunner);

    const savedOutboundOrder = await outboundOrderRepo.save(
      outboundOrderRepo.create({
        outboundCode,
        logisticsOrderId: Number(logisticsOrder.id),
        logisticsOrderCode: logisticsOrder.orderCode,
        shippingDemandId: Number(logisticsOrder.shippingDemandId),
        shippingDemandCode: logisticsOrder.shippingDemandCode,
        salesOrderId: Number(logisticsOrder.salesOrderId),
        salesOrderCode: logisticsOrder.salesOrderCode,
        outboundUserId: Number(dto.outboundUserId),
        outboundUserName: outboundUser.name || outboundUser.username,
        outboundDate: dto.outboundDate,
        outboundType: dto.outboundType,
        salesCompanyId: Number(dto.salesCompanyId),
        salesCompanyName: salesCompany.nameCn,
        warehouseId: Number(dto.warehouseId),
        warehouseName: lines[0]?.warehouseName ?? '',
        status: OutboundOrderStatus.CONFIRMED,
        salesTotalAmount: this.decimal(
          lines.reduce(
            (sum, line) => sum + line.salesUnitPrice * line.requestedQuantity,
            0,
          ),
        ),
        costTotalAmount: this.decimal(
          lines.reduce(
            (sum, line) => sum + line.costUnitPrice * line.requestedQuantity,
            0,
          ),
        ),
        remark: dto.remark?.trim() || null,
        sourceActionKey: dto.requestKey,
        createdBy: operator,
        updatedBy: operator,
      }),
    );

    const savedItems = await outboundItemRepo.save(
      lines.map((line) =>
        outboundItemRepo.create({
          outboundOrderId: Number(savedOutboundOrder.id),
          logisticsOrderItemId: Number(line.logisticsItem.id),
          shippingDemandItemId: Number(line.demandItem.id),
          salesOrderItemId: Number(line.demandItem.salesOrderItemId),
          skuId: Number(line.logisticsItem.skuId),
          skuCode: line.logisticsItem.skuCode,
          productNameCn: line.logisticsItem.productNameCn ?? null,
          productNameEn: line.logisticsItem.productNameEn ?? null,
          unitName: line.logisticsItem.unitName ?? null,
          plannedQuantity: Number(line.logisticsItem.plannedQuantity ?? 0),
          previousOutboundQuantity: Number(
            line.logisticsItem.outboundQuantity ?? 0,
          ),
          outboundQuantity: line.requestedQuantity,
          warehouseId: line.warehouseId,
          warehouseName: line.warehouseName,
          createdBy: operator,
          updatedBy: operator,
        }),
      ),
    );

    const shippingDemandItemIds = [
      ...new Set(lines.map((line) => Number(line.demandItem.id))),
    ];
    const salesOrderItemIds = [
      ...new Set(lines.map((line) => Number(line.demandItem.salesOrderItemId))),
    ];
    const demandIds = [...new Set(lines.map((line) => Number(line.demandItem.shippingDemandId)))];
    const demandItemRepo = queryRunner.manager.getRepository(ShippingDemandItem);
    const salesOrderItemRepo = queryRunner.manager.getRepository(SalesOrderItem);
    const logisticsOrderItemRepo = queryRunner.manager.getRepository(LogisticsOrderItem);
    const allocationRepo = queryRunner.manager.getRepository(
      ShippingDemandInventoryAllocation,
    );

    const savedItemByLogisticsItemId = new Map(
      savedItems.map((item) => [Number(item.logisticsOrderItemId), item]),
    );

    for (const line of lines) {
      const outboundItem = savedItemByLogisticsItemId.get(
        Number(line.logisticsItem.id),
      );
      if (!outboundItem) continue;

      const inventoryAllocations = line.allocations.map((item) => ({
        batchId: Number(item.allocation.inventoryBatchId),
        quantity: item.quantity,
      }));
      const itemActionKey = `${dto.requestKey}:item:${outboundItem.id}`;

      await this.inventoryService.deductLockedStockInTransaction(queryRunner, {
        skuId: Number(line.logisticsItem.skuId),
        warehouseId: line.warehouseId,
        allocations: inventoryAllocations,
        sourceDocumentType: 'outbound_order',
        sourceDocumentId: Number(savedOutboundOrder.id),
        sourceDocumentItemId: Number(outboundItem.id),
        sourceActionKey: itemActionKey,
        operator,
      });

      const consumptionRows: AllocationConsumptionResult[] = [];
      for (const allocationLine of line.allocations) {
        allocationLine.allocation.lockedQuantity =
          Number(allocationLine.allocation.lockedQuantity ?? 0) -
          allocationLine.quantity;
        allocationLine.allocation.shippedQuantity =
          Number(allocationLine.allocation.shippedQuantity ?? 0) +
          allocationLine.quantity;
        allocationLine.allocation.status =
          Number(allocationLine.allocation.lockedQuantity ?? 0) === 0
            ? ShippingDemandAllocationStatus.SHIPPED
            : ShippingDemandAllocationStatus.ACTIVE;
        if (operator !== undefined) {
          allocationLine.allocation.updatedBy = operator;
        }
        await allocationRepo.save(allocationLine.allocation);
        consumptionRows.push({
          allocationId: Number(allocationLine.allocation.id),
          inventoryBatchId: Number(allocationLine.allocation.inventoryBatchId),
          consumedQuantity: allocationLine.quantity,
        });
      }

      await consumptionRepo.save(
        consumptionRows.map((row) =>
          consumptionRepo.create({
            outboundOrderItemId: Number(outboundItem.id),
            shippingDemandAllocationId: row.allocationId,
            inventoryBatchId: row.inventoryBatchId,
            consumedQuantity: row.consumedQuantity,
            createdBy: operator,
            updatedBy: operator,
          }),
        ),
      );
    }

    await this.refreshShippingDemandItemQuantities(
      queryRunner,
      shippingDemandItemIds,
      operator,
    );
    await this.refreshLogisticsOrderItemOutboundQuantities(
      queryRunner,
      [Number(logisticsOrder.id)],
      operator,
    );
    await this.refreshSalesOrderItemShippedQuantities(
      queryRunner,
      salesOrderItemIds,
      operator,
    );

    const refreshedDemands = await this.findShippingDemandsForUpdate(
      queryRunner,
      demandIds,
    );
    const demandStatusChanges = await this.updateShippingDemandStatusesAfterOutbound(
      queryRunner,
      refreshedDemands,
      operator,
    );
    const salesOrderStatusChanges = await this.updateSalesOrderStatusesAfterOutbound(
      queryRunner,
      refreshedDemands,
      operator,
    );
    await this.updateLogisticsOrderStatusAfterOutbound(
      queryRunner,
      logisticsOrder,
      operator,
    );

    await this.writeCreateOperationLog(
      queryRunner,
      savedOutboundOrder,
      logisticsOrder,
      lines,
      operator,
    );
    await this.writeShippingDemandStatusOperationLogs(
      queryRunner,
      savedOutboundOrder,
      demandStatusChanges,
      operator,
    );
    await this.writeSalesOrderStatusOperationLogs(
      queryRunner,
      savedOutboundOrder,
      salesOrderStatusChanges,
      operator,
    );
    await this.writeLogisticsOrderOutboundOperationLog(
      queryRunner,
      logisticsOrder,
      savedOutboundOrder,
      lines,
      operator,
    );

    return savedOutboundOrder;
  }

  private async prepareOutboundLines(
    queryRunner: QueryRunner,
    logisticsOrder: LogisticsOrder,
    dto: CreateOutboundOrderDto,
  ): Promise<PreparedOutboundLine[]> {
    const duplicatedLogisticsItemIds = this.findDuplicatedIds(
      dto.items.map((item) => Number(item.logisticsOrderItemId)),
    );
    if (duplicatedLogisticsItemIds.length) {
      throw new BadRequestException({
        code: 'OUTBOUND_ORDER_DUPLICATE_LOGISTICS_ITEM',
        message: `存在重复的物流单明细：${duplicatedLogisticsItemIds.join('、')}`,
      });
    }

    const requestedByLogisticsItemId = new Map(
      dto.items.map((item) => [Number(item.logisticsOrderItemId), item]),
    );
    const warehouses = await this.resolveWarehouses(
      queryRunner,
      [Number(dto.warehouseId)],
    );
    const logisticsItems = (logisticsOrder.items ?? []).sort(
      (a, b) => Number(a.id) - Number(b.id),
    );
    if (!logisticsItems.length) {
      throw new BadRequestException({
        code: 'OUTBOUND_ORDER_ITEMS_EMPTY',
        message: '当前物流单没有货物明细，无法创建发货出库单',
      });
    }

    const demandItemIds = logisticsItems.map((item) =>
      Number(item.shippingDemandItemId),
    );
    const demandItems = await queryRunner.manager.getRepository(ShippingDemandItem).find({
      where: { id: In(demandItemIds) },
    });
    const demandItemById = new Map(
      demandItems.map((item) => [Number(item.id), item]),
    );
    const salesPriceBySalesOrderItemId =
      await this.findSalesPriceBySalesOrderItemId(
        queryRunner,
        logisticsItems.map((item) => Number(item.salesOrderItemId)),
      );
    const purchaseCostByDemandItemId =
      await this.findPurchaseCostByDemandItemId(queryRunner, demandItemIds);

    const lines: PreparedOutboundLine[] = [];
    for (const logisticsItem of logisticsItems) {
      const requested = requestedByLogisticsItemId.get(Number(logisticsItem.id));
      if (!requested) {
        continue;
      }
      if (!Number.isInteger(requested.outboundQuantity) || requested.outboundQuantity <= 0) {
        throw new BadRequestException({
          code: 'OUTBOUND_ORDER_QUANTITY_INVALID',
          message: `${logisticsItem.skuCode} 的实际出库数量必须为正整数`,
        });
      }

      const demandItem = demandItemById.get(Number(logisticsItem.shippingDemandItemId));
      if (!demandItem) {
        throw new BadRequestException({
          code: 'OUTBOUND_ORDER_DEMAND_ITEM_NOT_FOUND',
          message: `${logisticsItem.skuCode} 缺少关联发货需求明细，无法出库`,
        });
      }

      const plannedQuantity = Number(logisticsItem.plannedQuantity ?? 0);
      const outboundQuantity = Number(logisticsItem.outboundQuantity ?? 0);
      const remainingQuantity = Math.max(0, plannedQuantity - outboundQuantity);
      if (requested.outboundQuantity > remainingQuantity) {
        throw new BadRequestException({
          code: 'OUTBOUND_ORDER_QUANTITY_EXCEEDS_REMAINING',
          message: `${logisticsItem.skuCode} 的实际出库数量不能超过剩余可出库数量 ${remainingQuantity}`,
        });
      }

      const warehouse = warehouses.get(Number(dto.warehouseId));
      if (!warehouse) {
        throw new BadRequestException({
          code: 'OUTBOUND_ORDER_WAREHOUSE_NOT_FOUND',
          message: `${logisticsItem.skuCode} 的出库仓库不存在`,
        });
      }

      const allocations = await this.pickAllocationsForOutbound(
        queryRunner,
        demandItem,
        Number(dto.warehouseId),
        requested.outboundQuantity,
      );

      lines.push({
        logisticsItem,
        demandItem,
        requestedQuantity: requested.outboundQuantity,
        remainingQuantity,
        warehouseId: Number(dto.warehouseId),
        warehouseName: warehouse.name,
        salesUnitPrice: Number(
          salesPriceBySalesOrderItemId.get(Number(logisticsItem.salesOrderItemId)) ??
            demandItem.unitPrice ??
            0,
        ),
        costUnitPrice: Number(
          purchaseCostByDemandItemId.get(Number(demandItem.id)) ?? 0,
        ),
        allocations,
      });
    }

    if (!lines.length) {
      throw new BadRequestException({
        code: 'OUTBOUND_ORDER_ITEMS_EMPTY',
        message: '至少需要填写一条出库数量大于 0 的明细',
      });
    }
    if (lines.length !== requestedByLogisticsItemId.size) {
      const existingIds = new Set(logisticsItems.map((item) => Number(item.id)));
      const missingIds = [...requestedByLogisticsItemId.keys()].filter(
        (id) => !existingIds.has(id),
      );
      throw new BadRequestException({
        code: 'OUTBOUND_ORDER_ITEM_NOT_IN_LOGISTICS_ORDER',
        message: `以下物流单明细不属于当前物流单：${missingIds.join('、')}`,
      });
    }

    return lines;
  }

  private async pickAllocationsForOutbound(
    queryRunner: QueryRunner,
    demandItem: ShippingDemandItem,
    warehouseId: number,
    quantity: number,
  ) {
    const allocations = await queryRunner.manager
      .getRepository(ShippingDemandInventoryAllocation)
      .createQueryBuilder('allocation')
      .where('allocation.shipping_demand_item_id = :shippingDemandItemId', {
        shippingDemandItemId: Number(demandItem.id),
      })
      .andWhere('allocation.warehouse_id = :warehouseId', {
        warehouseId,
      })
      .andWhere('allocation.status = :status', {
        status: ShippingDemandAllocationStatus.ACTIVE,
      })
      .andWhere('allocation.locked_quantity > 0')
      .leftJoinAndSelect('allocation.inventoryBatch', 'inventoryBatch')
      .orderBy('inventoryBatch.receipt_date', 'ASC')
      .addOrderBy('inventoryBatch.id', 'ASC')
      .addOrderBy('allocation.id', 'ASC')
      .setLock('pessimistic_write')
      .getMany();

    let remaining = quantity;
    const picked: Array<{
      allocation: ShippingDemandInventoryAllocation;
      quantity: number;
    }> = [];

    for (const allocation of allocations) {
      if (remaining <= 0) break;
      const lockedQuantity = Number(allocation.lockedQuantity ?? 0);
      if (lockedQuantity <= 0) continue;
      const consumedQuantity = Math.min(lockedQuantity, remaining);
      picked.push({ allocation, quantity: consumedQuantity });
      remaining -= consumedQuantity;
    }

    if (remaining > 0) {
      const availableLocked = picked.reduce((sum, item) => sum + item.quantity, 0);
      throw new BadRequestException({
        code: 'OUTBOUND_ORDER_LOCKED_QUANTITY_EXCEEDED',
        message: `${demandItem.skuCode} 的出库数量超过本发货需求在该仓库的锁定量`,
        availableLocked,
      });
    }

    return picked;
  }

  private async resolveWarehouses(
    queryRunner: QueryRunner,
    warehouseIds: number[],
  ): Promise<Map<number, { id: number; name: string }>> {
    if (!warehouseIds.length) return new Map();
    const warehouses = await queryRunner.manager.getRepository(Warehouse).find({
      where: { id: In(warehouseIds) },
    });
    return new Map(
      warehouses.map((warehouse) => [
        Number(warehouse.id),
        { id: Number(warehouse.id), name: warehouse.name },
      ]),
    );
  }

  private async resolveOutboundUser(
    queryRunner: QueryRunner,
    outboundUserId: number,
  ): Promise<User> {
    const user = await queryRunner.manager.getRepository(User).findOne({
      where: { id: outboundUserId },
    });
    if (!user) {
      throw new BadRequestException({
        code: 'OUTBOUND_ORDER_USER_NOT_FOUND',
        message: '出库员不存在',
      });
    }
    return user;
  }

  private async resolveSalesCompany(
    queryRunner: QueryRunner,
    salesCompanyId: number,
  ): Promise<Company> {
    const company = await queryRunner.manager.getRepository(Company).findOne({
      where: { id: salesCompanyId },
    });
    if (!company) {
      throw new BadRequestException({
        code: 'OUTBOUND_ORDER_COMPANY_NOT_FOUND',
        message: '销售主体不存在',
      });
    }
    return company;
  }

  private async refreshShippingDemandItemQuantities(
    queryRunner: QueryRunner,
    shippingDemandItemIds: number[],
    operator?: string,
  ): Promise<void> {
    if (!shippingDemandItemIds.length) return;

    const rows = await queryRunner.manager
      .getRepository(ShippingDemandInventoryAllocation)
      .createQueryBuilder('allocation')
      .select('allocation.shipping_demand_item_id', 'shippingDemandItemId')
      .addSelect('SUM(allocation.locked_quantity)', 'lockedQuantity')
      .addSelect('SUM(allocation.shipped_quantity)', 'shippedQuantity')
      .where('allocation.shipping_demand_item_id IN (:...shippingDemandItemIds)', {
        shippingDemandItemIds,
      })
      .groupBy('allocation.shipping_demand_item_id')
      .getRawMany<{
        shippingDemandItemId: string;
        lockedQuantity: string;
        shippedQuantity: string;
      }>();

    const snapshotByItemId = new Map(
      rows.map((row) => [
        Number(row.shippingDemandItemId),
        {
          lockedRemainingQuantity: Number(row.lockedQuantity ?? 0),
          shippedQuantity: Number(row.shippedQuantity ?? 0),
        },
      ]),
    );

    const repo = queryRunner.manager.getRepository(ShippingDemandItem);
    const items = await repo.find({
      where: { id: In(shippingDemandItemIds) },
    });

    for (const item of items) {
      const snapshot = snapshotByItemId.get(Number(item.id));
      item.lockedRemainingQuantity = snapshot?.lockedRemainingQuantity ?? 0;
      item.shippedQuantity = snapshot?.shippedQuantity ?? 0;
      if (operator !== undefined) {
        item.updatedBy = operator;
      }
    }

    await repo.save(items);
  }

  private async refreshLogisticsOrderItemOutboundQuantities(
    queryRunner: QueryRunner,
    logisticsOrderIds: number[],
    operator?: string,
  ): Promise<void> {
    if (!logisticsOrderIds.length) return;

    const rows = await queryRunner.manager
      .getRepository(OutboundOrderItem)
      .createQueryBuilder('item')
      .innerJoin('item.outboundOrder', 'outboundOrder')
      .select('item.logistics_order_item_id', 'logisticsOrderItemId')
      .addSelect('SUM(item.outbound_quantity)', 'outboundQuantity')
      .where('outboundOrder.logistics_order_id IN (:...logisticsOrderIds)', {
        logisticsOrderIds,
      })
      .groupBy('item.logistics_order_item_id')
      .getRawMany<{
        logisticsOrderItemId: string;
        outboundQuantity: string;
      }>();

    const quantityByItemId = new Map(
      rows.map((row) => [
        Number(row.logisticsOrderItemId),
        Number(row.outboundQuantity ?? 0),
      ]),
    );

    const logisticsItemRepo = queryRunner.manager.getRepository(LogisticsOrderItem);
    const logisticsItems = await logisticsItemRepo
      .createQueryBuilder('item')
      .where('item.logistics_order_id IN (:...logisticsOrderIds)', {
        logisticsOrderIds,
      })
      .getMany();

    for (const item of logisticsItems) {
      item.outboundQuantity = quantityByItemId.get(Number(item.id)) ?? 0;
      if (operator !== undefined) {
        item.updatedBy = operator;
      }
    }

    await logisticsItemRepo.save(logisticsItems);
  }

  private async refreshSalesOrderItemShippedQuantities(
    queryRunner: QueryRunner,
    salesOrderItemIds: number[],
    operator?: string,
  ): Promise<void> {
    if (!salesOrderItemIds.length) return;

    const rows = await queryRunner.manager
      .getRepository(ShippingDemandItem)
      .createQueryBuilder('item')
      .innerJoin('item.shippingDemand', 'demand')
      .select('item.sales_order_item_id', 'salesOrderItemId')
      .addSelect('SUM(item.purchase_required_quantity)', 'purchaseQuantity')
      .addSelect('SUM(item.stock_required_quantity)', 'useStockQuantity')
      .addSelect('SUM(item.locked_remaining_quantity)', 'lockedQuantity')
      .addSelect('SUM(item.shipped_quantity)', 'shippedQuantity')
      .where('item.sales_order_item_id IN (:...salesOrderItemIds)', {
        salesOrderItemIds,
      })
      .andWhere('demand.status != :voided', {
        voided: ShippingDemandStatus.VOIDED,
      })
      .groupBy('item.sales_order_item_id')
      .getRawMany<{
        salesOrderItemId: string;
        purchaseQuantity: string;
        useStockQuantity: string;
        lockedQuantity: string;
        shippedQuantity: string;
      }>();

    const snapshotByItemId = new Map(
      rows.map((row) => [
        Number(row.salesOrderItemId),
        {
          purchaseQuantity: Number(row.purchaseQuantity ?? 0),
          useStockQuantity: Number(row.useStockQuantity ?? 0),
          preparedQuantity:
            Number(row.lockedQuantity ?? 0) + Number(row.shippedQuantity ?? 0),
          shippedQuantity: Number(row.shippedQuantity ?? 0),
        },
      ]),
    );

    const repo = queryRunner.manager.getRepository(SalesOrderItem);
    const items = await repo.find({
      where: { id: In(salesOrderItemIds) },
    });

    for (const item of items) {
      const snapshot = snapshotByItemId.get(Number(item.id));
      item.purchaseQuantity = snapshot?.purchaseQuantity ?? 0;
      item.useStockQuantity = snapshot?.useStockQuantity ?? 0;
      item.preparedQuantity = snapshot?.preparedQuantity ?? 0;
      item.shippedQuantity = snapshot?.shippedQuantity ?? 0;
      if (operator !== undefined) {
        item.updatedBy = operator;
      }
    }

    await repo.save(items);
  }

  private async findShippingDemandsForUpdate(
    queryRunner: QueryRunner,
    demandIds: number[],
  ): Promise<ShippingDemand[]> {
    if (!demandIds.length) return [];

    return queryRunner.manager
      .getRepository(ShippingDemand)
      .createQueryBuilder('demand')
      .leftJoinAndSelect('demand.items', 'items')
      .setLock('pessimistic_write')
      .where('demand.id IN (:...demandIds)', { demandIds })
      .orderBy('demand.id', 'ASC')
      .addOrderBy('items.id', 'ASC')
      .getMany();
  }

  private async updateShippingDemandStatusesAfterOutbound(
    queryRunner: QueryRunner,
    demands: ShippingDemand[],
    operator?: string,
  ): Promise<ShippingDemandStatusChange[]> {
    const repo = queryRunner.manager.getRepository(ShippingDemand);
    const changes: ShippingDemandStatusChange[] = [];

    for (const demand of demands) {
      if (demand.status === ShippingDemandStatus.VOIDED) {
        continue;
      }

      const oldStatus = demand.status as ShippingDemandStatus;
      const items = demand.items ?? [];
      const allShipped =
        items.length > 0 &&
        items.every(
          (item) =>
            Number(item.shippedQuantity ?? 0) >=
            Number(item.requiredQuantity ?? 0),
        );
      const anyShipped = items.some(
        (item) => Number(item.shippedQuantity ?? 0) > 0,
      );

      let nextStatus = oldStatus;
      if (allShipped) {
        nextStatus = ShippingDemandStatus.SHIPPED;
      } else if (anyShipped) {
        nextStatus = ShippingDemandStatus.PARTIALLY_SHIPPED;
      }

      if (nextStatus === oldStatus) continue;

      demand.status = nextStatus;
      if (operator !== undefined) {
        demand.updatedBy = operator;
      }
      const savedDemand = await repo.save(demand);
      changes.push({
        demand: savedDemand,
        oldStatus,
      });
    }

    return changes;
  }

  private async updateSalesOrderStatusesAfterOutbound(
    queryRunner: QueryRunner,
    demands: ShippingDemand[],
    operator?: string,
  ): Promise<SalesOrderStatusChange[]> {
    const salesOrderIds = [
      ...new Set(demands.map((demand) => Number(demand.salesOrderId))),
    ];
    if (!salesOrderIds.length) return [];

    const demandRows = await queryRunner.manager
      .getRepository(ShippingDemand)
      .createQueryBuilder('demand')
      .select('demand.sales_order_id', 'salesOrderId')
      .addSelect('MAX(CASE WHEN demand.status = :shipped THEN 1 ELSE 0 END)', 'hasShipped')
      .addSelect(
        'MIN(CASE WHEN demand.status = :shipped THEN 1 ELSE 0 END)',
        'allShipped',
      )
      .where('demand.sales_order_id IN (:...salesOrderIds)', { salesOrderIds })
      .andWhere('demand.status != :voided', {
        voided: ShippingDemandStatus.VOIDED,
      })
      .setParameters({ shipped: ShippingDemandStatus.SHIPPED })
      .groupBy('demand.sales_order_id')
      .getRawMany<{
        salesOrderId: string;
        hasShipped: string;
        allShipped: string;
      }>();

    const statusBySalesOrderId = new Map<number, SalesOrderStatus>();
    for (const row of demandRows) {
      const hasShipped = Number(row.hasShipped ?? 0) === 1;
      const allShipped = Number(row.allShipped ?? 0) === 1;
      if (allShipped) {
        statusBySalesOrderId.set(Number(row.salesOrderId), SalesOrderStatus.SHIPPED);
      } else if (hasShipped) {
        statusBySalesOrderId.set(
          Number(row.salesOrderId),
          SalesOrderStatus.PARTIALLY_SHIPPED,
        );
      }
    }

    const repo = queryRunner.manager.getRepository(SalesOrder);
    const orders = await repo
      .createQueryBuilder('salesOrder')
      .setLock('pessimistic_write')
      .where('salesOrder.id IN (:...salesOrderIds)', { salesOrderIds })
      .getMany();

    const changes: SalesOrderStatusChange[] = [];
    for (const order of orders) {
      const nextStatus = statusBySalesOrderId.get(Number(order.id));
      if (!nextStatus || nextStatus === order.status) continue;
      const oldStatus = order.status as SalesOrderStatus;
      order.status = nextStatus;
      if (operator !== undefined) {
        order.updatedBy = operator;
      }
      changes.push({
        order: await repo.save(order),
        oldStatus,
      });
    }

    return changes;
  }

  private async updateLogisticsOrderStatusAfterOutbound(
    queryRunner: QueryRunner,
    logisticsOrder: LogisticsOrder,
    operator?: string,
  ): Promise<void> {
    const items = await queryRunner.manager.getRepository(LogisticsOrderItem).find({
      where: { logisticsOrderId: Number(logisticsOrder.id) },
    });
    const allItemsShipped = items.every((item) => {
      const plannedQuantity = Number(item.plannedQuantity ?? 0);
      const outboundQuantity = Number(item.outboundQuantity ?? 0);
      return outboundQuantity >= plannedQuantity;
    });
    if (!allItemsShipped) return;

    const repo = queryRunner.manager.getRepository(LogisticsOrder);
    logisticsOrder.status = LogisticsOrderStatus.SHIPPED;
    if (operator !== undefined) {
      logisticsOrder.updatedBy = operator;
    }
    await repo.save(logisticsOrder);
  }

  private async findLogisticsOrderForOutbound(
    queryRunner: QueryRunner,
    logisticsOrderId: number,
    lock = false,
  ): Promise<LogisticsOrder> {
    const qb = queryRunner.manager
      .getRepository(LogisticsOrder)
      .createQueryBuilder('logisticsOrder')
      .leftJoinAndSelect('logisticsOrder.items', 'items')
      .where('logisticsOrder.id = :logisticsOrderId', { logisticsOrderId })
      .orderBy('items.id', 'ASC');

    if (lock) {
      qb.setLock('pessimistic_write');
    }

    const logisticsOrder = await qb.getOne();
    if (!logisticsOrder) {
      throw new NotFoundException('物流单不存在');
    }
    if (logisticsOrder.status !== LogisticsOrderStatus.CONFIRMED) {
      throw new BadRequestException({
        code: 'OUTBOUND_ORDER_LOGISTICS_STATUS_INVALID',
        message: '只有已确认的物流单可以创建发货出库单',
      });
    }

    const hasRemainingItems = (logisticsOrder.items ?? []).some((item) => {
      const plannedQuantity = Number(item.plannedQuantity ?? 0);
      const outboundQuantity = Number(item.outboundQuantity ?? 0);
      return plannedQuantity - outboundQuantity > 0;
    });
    if (!hasRemainingItems) {
      throw new BadRequestException({
        code: 'OUTBOUND_ORDER_LOGISTICS_FULLY_SHIPPED',
        message: '当前物流单已经全部出库，无需重复创建发货出库单',
      });
    }

    return logisticsOrder;
  }

  private async writeCreateOperationLog(
    queryRunner: QueryRunner,
    outboundOrder: OutboundOrder,
    logisticsOrder: LogisticsOrder,
    lines: PreparedOutboundLine[],
    operator?: string,
  ): Promise<void> {
    const repo = queryRunner.manager.getRepository(OperationLog);
    await repo.save(
      repo.create({
        operator: operator ?? 'system',
        operatorId: null,
        action: OperationLogAction.CREATE,
        resourceType: 'outbound-orders',
        resourceId: String(outboundOrder.id),
        resourcePath: '/api/outbound-orders',
        requestSummary: {
          sourceAction: 'confirm_outbound_order_from_logistics_order',
          logisticsOrderId: Number(logisticsOrder.id),
          logisticsOrderCode: logisticsOrder.orderCode,
          itemCount: lines.length,
          totalQuantity: lines.reduce(
            (sum, line) => sum + line.requestedQuantity,
            0,
          ),
        },
        changeSummary: [
          {
            field: 'status',
            fieldLabel: '出库单状态',
            oldValue: null,
            newValue: OutboundOrderStatus.CONFIRMED,
          },
          {
            field: 'outboundType',
            fieldLabel: '出库类型',
            oldValue: null,
            newValue: outboundOrder.outboundType ?? OutboundOrderType.SALES,
          },
        ],
      }),
    );
  }

  private async writeShippingDemandStatusOperationLogs(
    queryRunner: QueryRunner,
    outboundOrder: OutboundOrder,
    changes: ShippingDemandStatusChange[],
    operator?: string,
  ): Promise<void> {
    if (!changes.length) return;
    const repo = queryRunner.manager.getRepository(OperationLog);

    for (const change of changes) {
      await repo.save(
        repo.create({
          operator: operator ?? 'system',
          operatorId: null,
          action: OperationLogAction.UPDATE,
          resourceType: 'shipping-demands',
          resourceId: String(change.demand.id),
          resourcePath: `/api/outbound-orders/${outboundOrder.id}`,
          requestSummary: {
            sourceAction: 'outbound_order_confirmed',
            outboundOrderId: Number(outboundOrder.id),
            outboundCode: outboundOrder.outboundCode,
          },
          changeSummary: [
            {
              field: 'status',
              fieldLabel: '发货需求状态',
              oldValue: change.oldStatus,
              newValue: change.demand.status,
            },
          ],
        }),
      );
    }
  }

  private async writeSalesOrderStatusOperationLogs(
    queryRunner: QueryRunner,
    outboundOrder: OutboundOrder,
    changes: SalesOrderStatusChange[],
    operator?: string,
  ): Promise<void> {
    if (!changes.length) return;
    const repo = queryRunner.manager.getRepository(OperationLog);

    for (const change of changes) {
      await repo.save(
        repo.create({
          operator: operator ?? 'system',
          operatorId: null,
          action: OperationLogAction.UPDATE,
          resourceType: 'sales-orders',
          resourceId: String(change.order.id),
          resourcePath: `/api/outbound-orders/${outboundOrder.id}`,
          requestSummary: {
            sourceAction: 'outbound_order_confirmed',
            outboundOrderId: Number(outboundOrder.id),
            outboundCode: outboundOrder.outboundCode,
          },
          changeSummary: [
            {
              field: 'status',
              fieldLabel: '销售订单状态',
              oldValue: change.oldStatus,
              newValue: change.order.status,
            },
          ],
        }),
      );
    }
  }

  private async writeLogisticsOrderOutboundOperationLog(
    queryRunner: QueryRunner,
    logisticsOrder: LogisticsOrder,
    outboundOrder: OutboundOrder,
    lines: PreparedOutboundLine[],
    operator?: string,
  ): Promise<void> {
    const repo = queryRunner.manager.getRepository(OperationLog);
    await repo.save(
      repo.create({
        operator: operator ?? 'system',
        operatorId: null,
        action: OperationLogAction.UPDATE,
        resourceType: 'logistics-orders',
        resourceId: String(logisticsOrder.id),
        resourcePath: `/api/outbound-orders/${outboundOrder.id}`,
        requestSummary: {
          sourceAction: 'outbound_order_confirmed',
          outboundOrderId: Number(outboundOrder.id),
          outboundCode: outboundOrder.outboundCode,
        },
        changeSummary: [
          {
            field: 'outboundSummary',
            fieldLabel: '出库结果',
            oldValue: null,
            newValue: lines.map((line) => ({
              logisticsOrderItemId: Number(line.logisticsItem.id),
              skuCode: line.logisticsItem.skuCode,
              productNameCn: line.logisticsItem.productNameCn,
              productNameEn: line.logisticsItem.productNameEn,
              warehouseName: line.warehouseName,
              outboundQuantity: line.requestedQuantity,
            })),
          },
        ],
      }),
    );
  }

  private async generateOutboundCode(queryRunner: QueryRunner): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const prefix = `QTCK${year}${month}${day}`;
    const latest = await queryRunner.manager
      .getRepository(OutboundOrder)
      .createQueryBuilder('outboundOrder')
      .setLock('pessimistic_write')
      .where('outboundOrder.outbound_code LIKE :prefix', {
        prefix: `${prefix}%`,
      })
      .orderBy('outboundOrder.outbound_code', 'DESC')
      .getOne();
    const lastNumber = latest?.outboundCode
      ? Number(latest.outboundCode.slice(prefix.length))
      : 0;
    return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`;
  }

  private async executeWithOutboundOrderCodeRetry<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    let retryCount = 0;
    while (true) {
      const queryRunner = this.outboundOrdersRepository.createQueryRunner();
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
          retryCount < MAX_OUTBOUND_ORDER_CODE_RETRIES
        ) {
          retryCount += 1;
          await this.delay(INITIAL_RETRY_DELAY_MS * 2 ** (retryCount - 1));
          continue;
        }

        if (this.isRetryableConcurrencyError(error)) {
          throw new ConflictException({
            code: 'CONCURRENT_UPDATE',
            message: '发货出库并发更新失败，请稍后重试',
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

  private findDuplicatedIds(ids: number[]): number[] {
    const seen = new Set<number>();
    const duplicated = new Set<number>();
    for (const id of ids) {
      if (seen.has(id)) {
        duplicated.add(id);
      }
      seen.add(id);
    }
    return [...duplicated].sort((a, b) => a - b);
  }

  private decimal(value: number): string {
    return value.toFixed(2);
  }
}
