import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FulfillmentType,
  InventoryChangeType,
  SalesOrderStatus,
  ShippingDemandAllocationStatus,
  ShippingDemandStatus,
} from '@infitek/shared';
import { QueryRunner, Repository } from 'typeorm';
import { FilesService } from '../../files/files.service';
import { InventorySummary } from '../inventory/entities/inventory-summary.entity';
import { InventoryTransaction } from '../inventory/entities/inventory-transaction.entity';
import {
  InventoryService,
  type AvailableInventoryItem,
} from '../inventory/inventory.service';
import {
  OperationLog,
  OperationLogAction,
} from '../operation-logs/entities/operation-log.entity';
import { Supplier } from '../master-data/suppliers/entities/supplier.entity';
import { SalesOrder } from '../sales-orders/entities/sales-order.entity';
import { SalesOrderItem } from '../sales-orders/entities/sales-order-item.entity';
import { ConfirmShippingDemandAllocationDto } from './dto/confirm-shipping-demand-allocation.dto';
import { QueryShippingDemandDto } from './dto/query-shipping-demand.dto';
import { UpdateShippingDemandItemSupplierDto } from './dto/update-shipping-demand-item-supplier.dto';
import { UpdateShippingDemandDto } from './dto/update-shipping-demand.dto';
import { ShippingDemandInventoryAllocation } from './entities/shipping-demand-inventory-allocation.entity';
import { ShippingDemandItem } from './entities/shipping-demand-item.entity';
import { ShippingDemand } from './entities/shipping-demand.entity';
import { ShippingDemandsRepository } from './shipping-demands.repository';

const MAX_DEMAND_CODE_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 50;
const MAX_CONFIRM_ALLOCATION_RETRIES = 3;
const INITIAL_CONFIRM_ALLOCATION_RETRY_DELAY_MS = 25;
const EDITABLE_SHIPPING_DEMAND_FIELDS = new Set([
  'afterSalesProductSummary',
  'tradeTerm',
  'bankAccount',
  'primaryIndustry',
  'secondaryIndustry',
  'exchangeRate',
  'crmSignedAt',
  'paymentTerm',
  'orderNature',
  'receiptStatus',
  'merchandiserAbbr',
  'transportationMethod',
  'requiredDeliveryAt',
  'isSharedOrder',
  'isSinosure',
  'isAliTradeAssurance',
  'isInsured',
  'isPalletized',
  'isSplitInAdvance',
  'requiresExportCustoms',
  'requiresWarrantyCard',
  'requiresCustomsCertificate',
  'requiresMaternityHandover',
  'customsDeclarationMethod',
  'usesMarketingFund',
  'aliTradeAssuranceOrderCode',
  'forwarderQuoteNote',
  'contractFileKeys',
  'contractFileNames',
  'plugPhotoKeys',
  'consigneeCompany',
  'consigneeOtherInfo',
  'notifyCompany',
  'notifyOtherInfo',
  'shipperCompany',
  'domesticCustomerCompany',
  'domesticCustomerDeliveryInfo',
  'usesDefaultShippingMark',
  'shippingMarkNote',
  'shippingMarkTemplateKey',
  'needsInvoice',
  'invoiceType',
  'shippingDocumentsNote',
  'blType',
  'originalMailAddress',
  'businessRectificationNote',
  'customsDocumentNote',
  'otherRequirementNote',
]);
const READONLY_ECHO_SHIPPING_DEMAND_FIELDS = new Set(['status']);

interface PreparedAllocationLine {
  item: ShippingDemandItem;
  fulfillmentType: FulfillmentType;
  stockQuantity: number;
  purchaseQuantity: number;
  warehouseId: number | null;
  purchaseSupplier: PurchaseSupplierSnapshot | null;
}

interface PurchaseSupplierSnapshot {
  supplierId: number;
  supplierName: string;
  supplierCode: string;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  paymentTermName: string | null;
}

interface ActiveAllocationGroup {
  skuId: number;
  warehouseId: number;
  allocations: ShippingDemandInventoryAllocation[];
  quantity: number;
}

const FULFILLMENT_TYPE_LABELS: Record<FulfillmentType, string> = {
  [FulfillmentType.FULL_PURCHASE]: '全部采购',
  [FulfillmentType.PARTIAL_PURCHASE]: '部分采购',
  [FulfillmentType.USE_STOCK]: '使用现有库存',
};

@Injectable()
export class ShippingDemandsService {
  constructor(
    private readonly shippingDemandsRepository: ShippingDemandsRepository,
    private readonly inventoryService: InventoryService,
    private readonly filesService: FilesService,
  ) {}

  async findById(
    id: number,
  ): Promise<ShippingDemand & Record<string, unknown>> {
    const demand = await this.shippingDemandsRepository.findById(id);
    if (!demand) {
      throw new NotFoundException('发货需求不存在');
    }
    return this.withSignedUrls(demand);
  }

  findAll(query: QueryShippingDemandDto) {
    return this.shippingDemandsRepository.findAll(query);
  }

  async update(
    id: number,
    dto: UpdateShippingDemandDto,
    operator?: string,
  ): Promise<ShippingDemand & Record<string, unknown>> {
    const demand = await this.shippingDemandsRepository.findById(id);
    if (!demand) {
      throw new NotFoundException('发货需求不存在');
    }
    if (demand.status === ShippingDemandStatus.VOIDED) {
      throw new BadRequestException('已作废发货需求不允许编辑');
    }
    this.assertEditableUpdatePayload(dto, demand);

    const updateData = this.buildUpdateData(dto, operator);
    if (Object.keys(updateData).length === 0) {
      return this.withSignedUrls(demand);
    }

    return this.withSignedUrls(
      await this.shippingDemandsRepository.update(id, updateData),
    );
  }

  async updateItemPurchaseSupplier(
    id: number,
    itemId: number,
    dto: UpdateShippingDemandItemSupplierDto,
    operator?: string,
  ): Promise<ShippingDemand & Record<string, unknown>> {
    const demandId = await this.executeWithConfirmAllocationRetry(
      async (queryRunner) => {
        await this.updateItemPurchaseSupplierInTransaction(
          queryRunner,
          id,
          itemId,
          dto.purchaseSupplierId,
          operator,
        );
        return id;
      },
    );

    return this.findById(demandId);
  }

  async generateFromSalesOrder(
    salesOrderId: number,
    operator?: string,
  ): Promise<ShippingDemand> {
    const demandId = await this.executeWithDemandCodeRetry(
      async (queryRunner) => {
        const savedDemand = await this.generateFromSalesOrderInTransaction(
          queryRunner,
          salesOrderId,
          operator,
        );

        return Number(savedDemand.id);
      },
    );

    return this.findById(demandId);
  }

  async confirmAllocation(
    id: number,
    dto: ConfirmShippingDemandAllocationDto,
    operator?: string,
  ): Promise<ShippingDemand & Record<string, unknown>> {
    const demandId = await this.executeWithConfirmAllocationRetry(
      async (queryRunner) => {
        await this.confirmAllocationInTransaction(
          queryRunner,
          id,
          dto,
          operator,
        );
        return id;
      },
    );

    return this.findById(demandId);
  }

  async voidDemand(
    id: number,
    operator?: string,
  ): Promise<ShippingDemand & Record<string, unknown>> {
    const demandId = await this.executeWithConfirmAllocationRetry(
      async (queryRunner) => {
        await this.voidDemandInTransaction(queryRunner, id, operator);
        return id;
      },
    );

    return this.findById(demandId);
  }

  private async generateFromSalesOrderInTransaction(
    queryRunner: QueryRunner,
    salesOrderId: number,
    operator?: string,
  ): Promise<ShippingDemand> {
    const order = await this.findSalesOrderForGeneration(
      queryRunner,
      salesOrderId,
    );

    const existingDemand = await this.findActiveDemandForUpdate(
      queryRunner,
      salesOrderId,
    );
    if (existingDemand) {
      throw new BadRequestException('该销售订单已存在未作废的发货需求');
    }

    this.assertGeneratable(order);

    const demandCode = await this.generateDemandCode(queryRunner);
    const skuIds = [
      ...new Set((order.items ?? []).map((item) => Number(item.skuId))),
    ];
    const availableInventory = await this.inventoryService.findAvailable({
      skuIds,
    });
    const availableBySkuId =
      this.groupAvailableInventoryBySkuId(availableInventory);

    const demandRepo = queryRunner.manager.getRepository(ShippingDemand);
    const itemRepo = queryRunner.manager.getRepository(ShippingDemandItem);
    const savedDemand = await demandRepo.save(
      demandRepo.create({
        demandCode,
        salesOrderId: Number(order.id),
        sourceDocumentCode: order.erpSalesOrderCode,
        sourceDocumentType: 'sales_order',
        status: ShippingDemandStatus.PENDING_ALLOCATION,
        orderType: order.orderType,
        orderSource: order.orderSource,
        domesticTradeType: order.domesticTradeType,
        externalOrderCode: order.externalOrderCode,
        customerId: order.customerId,
        customerName: order.customerName,
        customerCode: order.customerCode,
        customerContactPerson: order.customerContactPerson,
        afterSalesSourceOrderId: order.afterSalesSourceOrderId,
        afterSalesSourceOrderCode: order.afterSalesSourceOrderCode,
        afterSalesProductSummary: order.afterSalesProductSummary,
        currencyId: order.currencyId,
        currencyCode: order.currencyCode,
        currencyName: order.currencyName,
        currencySymbol: order.currencySymbol,
        tradeTerm: order.tradeTerm,
        bankAccount: order.bankAccount,
        extraViewerId: order.extraViewerId,
        extraViewerName: order.extraViewerName,
        primaryIndustry: order.primaryIndustry,
        secondaryIndustry: order.secondaryIndustry,
        exchangeRate: order.exchangeRate,
        crmSignedAt: order.crmSignedAt,
        paymentTerm: order.paymentTerm,
        shipmentOriginCountryId: order.shipmentOriginCountryId,
        shipmentOriginCountryName: order.shipmentOriginCountryName,
        destinationCountryId: order.destinationCountryId,
        destinationCountryName: order.destinationCountryName,
        destinationPortId: order.destinationPortId,
        destinationPortName: order.destinationPortName,
        signingCompanyId: order.signingCompanyId,
        signingCompanyName: order.signingCompanyName,
        salespersonId: order.salespersonId,
        salespersonName: order.salespersonName,
        merchandiserId: order.merchandiserId,
        merchandiserName: order.merchandiserName,
        merchandiserAbbr: order.merchandiserAbbr,
        orderNature: order.orderNature,
        receiptStatus: order.receiptStatus,
        transportationMethod: order.transportationMethod,
        requiredDeliveryAt: order.requiredDeliveryAt,
        isSharedOrder: order.isSharedOrder,
        isSinosure: order.isSinosure,
        isAliTradeAssurance: order.isAliTradeAssurance,
        isInsured: order.isInsured,
        isPalletized: order.isPalletized,
        isSplitInAdvance: order.isSplitInAdvance,
        requiresExportCustoms: order.requiresExportCustoms,
        requiresWarrantyCard: order.requiresWarrantyCard,
        requiresCustomsCertificate: order.requiresCustomsCertificate,
        requiresMaternityHandover: order.requiresMaternityHandover,
        customsDeclarationMethod: order.customsDeclarationMethod,
        usesMarketingFund: order.usesMarketingFund,
        aliTradeAssuranceOrderCode: order.aliTradeAssuranceOrderCode,
        forwarderQuoteNote: order.forwarderQuoteNote,
        contractFileKeys: order.contractFileKeys,
        contractFileNames: order.contractFileNames,
        plugPhotoKeys: order.plugPhotoKeys,
        consigneeCompany: order.consigneeCompany,
        consigneeOtherInfo: order.consigneeOtherInfo,
        notifyCompany: order.notifyCompany,
        notifyOtherInfo: order.notifyOtherInfo,
        shipperCompany: order.shipperCompany,
        shipperOtherInfoCompanyId: order.shipperOtherInfoCompanyId,
        shipperOtherInfoCompanyName: order.shipperOtherInfoCompanyName,
        domesticCustomerCompany: order.domesticCustomerCompany,
        domesticCustomerDeliveryInfo: order.domesticCustomerDeliveryInfo,
        usesDefaultShippingMark: order.usesDefaultShippingMark,
        shippingMarkNote: order.shippingMarkNote,
        shippingMarkTemplateKey: order.shippingMarkTemplateKey,
        needsInvoice: order.needsInvoice,
        invoiceType: order.invoiceType,
        shippingDocumentsNote: order.shippingDocumentsNote,
        blType: order.blType,
        originalMailAddress: order.originalMailAddress,
        businessRectificationNote: order.businessRectificationNote,
        customsDocumentNote: order.customsDocumentNote,
        otherRequirementNote: order.otherRequirementNote,
        contractAmount: order.contractAmount,
        receivedAmount: order.receivedAmount,
        outstandingAmount: order.outstandingAmount,
        productTotalAmount: order.productTotalAmount,
        expenseTotalAmount: order.expenseTotalAmount,
        totalAmount: order.totalAmount,
        createdBy: operator,
        updatedBy: operator,
      }),
    );

    const demandItems = (order.items ?? []).map((item) =>
      itemRepo.create({
        shippingDemandId: Number(savedDemand.id),
        salesOrderItemId: Number(item.id),
        skuId: item.skuId,
        skuCode: item.skuCode,
        productNameCn: item.productNameCn,
        productNameEn: item.productNameEn,
        lineType: item.lineType,
        spuId: item.spuId,
        spuName: item.spuName,
        electricalParams: item.electricalParams,
        hasPlug: item.hasPlug,
        plugType: item.plugType,
        unitPrice: item.unitPrice,
        currencyId: item.currencyId,
        currencyCode: item.currencyCode,
        unitId: item.unitId,
        unitName: item.unitName,
        purchaserId: item.purchaserId,
        purchaserName: item.purchaserName,
        needsPurchase: item.needsPurchase,
        requiredQuantity: item.quantity,
        availableStockSnapshot: availableBySkuId.get(Number(item.skuId)) ?? [],
        fulfillmentType: null,
        stockRequiredQuantity: 0,
        purchaseRequiredQuantity: 0,
        lockedRemainingQuantity: 0,
        shippedQuantity: 0,
        purchaseOrderedQuantity: 0,
        receivedQuantity: 0,
        amount: item.amount,
        material: item.material,
        imageUrl: item.imageUrl,
        totalVolumeCbm: item.totalVolumeCbm,
        totalWeightKg: item.totalWeightKg,
        unitWeightKg: item.unitWeightKg,
        unitVolumeCbm: item.unitVolumeCbm,
        skuSpecification: item.skuSpecification,
        createdBy: operator,
        updatedBy: operator,
      }),
    );
    await itemRepo.save(demandItems);

    await queryRunner.manager
      .getRepository(SalesOrder)
      .update(Number(order.id), {
        status: SalesOrderStatus.PREPARING,
        updatedBy: operator,
      });
    await this.writeSalesOrderStatusOperationLog(queryRunner, order, operator);

    return savedDemand;
  }

  private async confirmAllocationInTransaction(
    queryRunner: QueryRunner,
    id: number,
    dto: ConfirmShippingDemandAllocationDto,
    operator?: string,
  ): Promise<void> {
    const demand = await this.findShippingDemandForAllocation(queryRunner, id);
    const preparedLines = await this.prepareAllocationLines(
      queryRunner,
      demand,
      dto,
    );
    const oldStatus = demand.status;
    const hasPurchaseQuantity = preparedLines.some(
      (line) => line.purchaseQuantity > 0,
    );
    const nextStatus = hasPurchaseQuantity
      ? ShippingDemandStatus.PENDING_PURCHASE_ORDER
      : ShippingDemandStatus.PREPARED;

    const itemRepo = queryRunner.manager.getRepository(ShippingDemandItem);
    const allocationRepo = queryRunner.manager.getRepository(
      ShippingDemandInventoryAllocation,
    );
    const inventoryTransactionRepo =
      queryRunner.manager.getRepository(InventoryTransaction);

    for (const line of preparedLines) {
      line.item.fulfillmentType = line.fulfillmentType;
      line.item.stockRequiredQuantity = line.stockQuantity;
      line.item.purchaseRequiredQuantity = line.purchaseQuantity;
      line.item.lockedRemainingQuantity = line.stockQuantity;
      line.item.purchaseSupplierId = line.purchaseSupplier?.supplierId ?? null;
      line.item.purchaseSupplierName =
        line.purchaseSupplier?.supplierName ?? null;
      line.item.purchaseSupplierCode =
        line.purchaseSupplier?.supplierCode ?? null;
      line.item.purchaseSupplierContactPerson =
        line.purchaseSupplier?.contactPerson ?? null;
      line.item.purchaseSupplierContactPhone =
        line.purchaseSupplier?.contactPhone ?? null;
      line.item.purchaseSupplierContactEmail =
        line.purchaseSupplier?.contactEmail ?? null;
      line.item.purchaseSupplierPaymentTermName =
        line.purchaseSupplier?.paymentTermName ?? null;
      if (operator !== undefined) {
        line.item.updatedBy = operator;
      }

      if (line.stockQuantity > 0) {
        const warehouseId = line.warehouseId;
        if (!warehouseId) {
          throw new BadRequestException({
            code: 'WAREHOUSE_REQUIRED',
            message: `${line.item.skuCode} 使用库存时必须选择仓库`,
          });
        }
        const lockResult = await this.inventoryService.lockStockInTransaction(
          queryRunner,
          {
            skuId: Number(line.item.skuId),
            warehouseId,
            quantity: line.stockQuantity,
            operator,
          },
        );
        await allocationRepo.save(
          (lockResult.allocations ?? []).map((allocation) =>
            allocationRepo.create({
              shippingDemandId: Number(demand.id),
              shippingDemandItemId: Number(line.item.id),
              salesOrderItemId: Number(line.item.salesOrderItemId),
              skuId: Number(line.item.skuId),
              warehouseId,
              inventoryBatchId: allocation.batchId,
              lockSource: 'existing_stock',
              sourceDocumentType: 'shipping_demand',
              sourceDocumentId: Number(demand.id),
              originalLockedQuantity: allocation.quantity,
              lockedQuantity: allocation.quantity,
              shippedQuantity: 0,
              releasedQuantity: 0,
              status: ShippingDemandAllocationStatus.ACTIVE,
              sourceActionKey: this.buildAllocationActionKey(
                demand,
                line.item,
                allocation.batchId,
              ),
              createdBy: operator,
              updatedBy: operator,
            }),
          ),
        );
        await inventoryTransactionRepo.save(
          this.buildLockInventoryTransactions(
            inventoryTransactionRepo,
            demand,
            line.item,
            warehouseId,
            lockResult.summary,
            lockResult.allocations ?? [],
            operator,
          ),
        );
      }

      await itemRepo.save(line.item);
    }

    demand.status = nextStatus;
    if (operator !== undefined) {
      demand.updatedBy = operator;
    }
    await queryRunner.manager.getRepository(ShippingDemand).save(demand);

    if (nextStatus === ShippingDemandStatus.PREPARED) {
      await queryRunner.manager
        .getRepository(SalesOrder)
        .update(demand.salesOrderId, {
          status: SalesOrderStatus.PREPARED,
          updatedBy: operator,
        });
    }

    await this.writeShippingDemandAllocationOperationLog(
      queryRunner,
      demand,
      oldStatus,
      nextStatus,
      preparedLines,
      operator,
    );
  }

  private async updateItemPurchaseSupplierInTransaction(
    queryRunner: QueryRunner,
    id: number,
    itemId: number,
    purchaseSupplierId: number,
    operator?: string,
  ): Promise<void> {
    const demand = await queryRunner.manager
      .getRepository(ShippingDemand)
      .createQueryBuilder('demand')
      .leftJoinAndSelect('demand.items', 'items')
      .setLock('pessimistic_write')
      .where('demand.id = :id', { id })
      .orderBy('items.id', 'ASC')
      .getOne();

    if (!demand) {
      throw new NotFoundException('发货需求不存在');
    }
    if (demand.status === ShippingDemandStatus.VOIDED) {
      throw new BadRequestException({
        code: 'SHIPPING_DEMAND_ITEM_SUPPLIER_UPDATE_NOT_ALLOWED',
        message: '已作废发货需求不允许编辑采购供应商',
      });
    }

    const item = (demand.items ?? []).find(
      (line) => Number(line.id) === itemId,
    );
    if (!item) {
      throw new BadRequestException({
        code: 'SHIPPING_DEMAND_ITEM_NOT_FOUND',
        message: '发货需求明细不存在',
      });
    }

    const oldSupplierName = item.purchaseSupplierName;
    const supplierSnapshot = await this.getPurchaseSupplierSnapshot(
      queryRunner,
      purchaseSupplierId,
      new Map(),
      item,
    );
    item.purchaseSupplierId = supplierSnapshot.supplierId;
    item.purchaseSupplierName = supplierSnapshot.supplierName;
    item.purchaseSupplierCode = supplierSnapshot.supplierCode;
    item.purchaseSupplierContactPerson = supplierSnapshot.contactPerson;
    item.purchaseSupplierContactPhone = supplierSnapshot.contactPhone;
    item.purchaseSupplierContactEmail = supplierSnapshot.contactEmail;
    item.purchaseSupplierPaymentTermName = supplierSnapshot.paymentTermName;
    if (operator !== undefined) {
      item.updatedBy = operator;
    }
    await queryRunner.manager.getRepository(ShippingDemandItem).save(item);
    await this.writeShippingDemandItemSupplierOperationLog(
      queryRunner,
      demand,
      item,
      oldSupplierName,
      supplierSnapshot.supplierName,
      operator,
    );
  }

  private async voidDemandInTransaction(
    queryRunner: QueryRunner,
    id: number,
    operator?: string,
  ): Promise<void> {
    const demandReference = await queryRunner.manager
      .getRepository(ShippingDemand)
      .createQueryBuilder('demand')
      .where('demand.id = :id', { id })
      .getOne();

    if (!demandReference) {
      throw new NotFoundException('发货需求不存在');
    }

    const order = await queryRunner.manager
      .getRepository(SalesOrder)
      .createQueryBuilder('salesOrder')
      .setLock('pessimistic_write')
      .where('salesOrder.id = :salesOrderId', {
        salesOrderId: demandReference.salesOrderId,
      })
      .getOne();

    if (!order) {
      throw new NotFoundException('销售订单不存在');
    }

    const demand = await queryRunner.manager
      .getRepository(ShippingDemand)
      .createQueryBuilder('demand')
      .leftJoinAndSelect('demand.items', 'items')
      .setLock('pessimistic_write')
      .where('demand.id = :id', { id })
      .orderBy('items.id', 'ASC')
      .getOne();

    if (!demand) {
      throw new NotFoundException('发货需求不存在');
    }

    if (demand.status === ShippingDemandStatus.VOIDED) {
      return;
    }

    if (demand.status !== ShippingDemandStatus.PENDING_ALLOCATION) {
      throw new BadRequestException({
        code: 'SHIPPING_DEMAND_VOID_NOT_ALLOWED',
        message: '只有待分配库存的发货需求可以作废',
      });
    }

    const allocationRepo = queryRunner.manager.getRepository(
      ShippingDemandInventoryAllocation,
    );
    const itemRepo = queryRunner.manager.getRepository(ShippingDemandItem);
    const inventoryTransactionRepo =
      queryRunner.manager.getRepository(InventoryTransaction);
    const oldStatus = demand.status;

    const activeAllocations = await allocationRepo
      .createQueryBuilder('allocation')
      .where('allocation.shipping_demand_id = :id', { id })
      .andWhere('allocation.status = :status', {
        status: ShippingDemandAllocationStatus.ACTIVE,
      })
      .andWhere('allocation.locked_quantity > 0')
      .orderBy('allocation.id', 'ASC')
      .getMany();

    const allocationGroups = this.groupActiveAllocations(activeAllocations);
    const unlockTransactions: InventoryTransaction[] = [];

    for (const group of allocationGroups) {
      const unlockResult = await this.inventoryService.unlockStockInTransaction(
        queryRunner,
        {
          skuId: group.skuId,
          warehouseId: group.warehouseId,
          allocations: group.allocations.map((allocation) => ({
            batchId: Number(allocation.inventoryBatchId),
            quantity: Number(allocation.lockedQuantity),
          })),
          operator,
        },
      );

      unlockTransactions.push(
        this.buildUnlockInventoryTransaction(
          inventoryTransactionRepo,
          demand,
          group,
          unlockResult.summary,
          operator,
        ),
      );

      const lockedAllocations = await allocationRepo
        .createQueryBuilder('allocation')
        .setLock('pessimistic_write')
        .where('allocation.id IN (:...ids)', {
          ids: group.allocations.map((allocation) => Number(allocation.id)),
        })
        .orderBy('allocation.id', 'ASC')
        .getMany();

      for (const allocation of lockedAllocations) {
        const lockedQuantity = Number(allocation.lockedQuantity ?? 0);
        allocation.releasedQuantity =
          Number(allocation.releasedQuantity ?? 0) + lockedQuantity;
        allocation.lockedQuantity = 0;
        allocation.status = ShippingDemandAllocationStatus.RELEASED;
        if (operator !== undefined) {
          allocation.updatedBy = operator;
        }
        await allocationRepo.save(allocation);
      }
    }

    if (unlockTransactions.length > 0) {
      await inventoryTransactionRepo.save(unlockTransactions);
    }

    for (const item of demand.items ?? []) {
      item.lockedRemainingQuantity = 0;
      if (operator !== undefined) {
        item.updatedBy = operator;
      }
      await itemRepo.save(item);
    }

    const salesOrderItemIds = [
      ...new Set(
        (demand.items ?? []).map((item) => Number(item.salesOrderItemId)),
      ),
    ].filter((itemId) => itemId > 0);
    if (salesOrderItemIds.length > 0) {
      await queryRunner.manager
        .getRepository(SalesOrderItem)
        .createQueryBuilder()
        .update(SalesOrderItem)
        .set({
          purchaseQuantity: 0,
          useStockQuantity: 0,
          preparedQuantity: 0,
          shippedQuantity: 0,
          updatedBy: operator,
        })
        .where('id IN (:...ids)', { ids: salesOrderItemIds })
        .execute();
    }

    demand.status = ShippingDemandStatus.VOIDED;
    demand.voidedAt = new Date();
    demand.voidedBy = operator ?? 'system';
    if (operator !== undefined) {
      demand.updatedBy = operator;
    }
    await queryRunner.manager.getRepository(ShippingDemand).save(demand);

    await queryRunner.manager
      .getRepository(SalesOrder)
      .update(demand.salesOrderId, {
        status: SalesOrderStatus.APPROVED,
        updatedBy: operator,
      });

    await this.writeShippingDemandVoidOperationLog(
      queryRunner,
      demand,
      oldStatus,
      activeAllocations,
      operator,
    );
    await this.writeSalesOrderRollbackOperationLog(
      queryRunner,
      order,
      demand,
      operator,
    );
  }

  private async findShippingDemandForAllocation(
    queryRunner: QueryRunner,
    id: number,
  ): Promise<ShippingDemand> {
    const demand = await queryRunner.manager
      .getRepository(ShippingDemand)
      .createQueryBuilder('demand')
      .leftJoinAndSelect('demand.items', 'items')
      .setLock('pessimistic_write')
      .where('demand.id = :id', { id })
      .orderBy('items.id', 'ASC')
      .getOne();

    if (!demand) {
      throw new NotFoundException('发货需求不存在');
    }
    if (demand.status !== ShippingDemandStatus.PENDING_ALLOCATION) {
      throw new BadRequestException({
        code: 'ALLOCATION_ALREADY_CONFIRMED',
        message: '只有待分配库存的发货需求可以确认分配',
      });
    }
    if (!demand.items?.length) {
      throw new BadRequestException('发货需求没有产品明细，无法确认分配');
    }
    return demand;
  }

  private assertEditableUpdatePayload(
    dto: UpdateShippingDemandDto,
    demand: ShippingDemand,
  ): void {
    const providedEntries = this.getProvidedDtoEntries(dto);
    const protectedFields = providedEntries
      .filter(
        ([key]) =>
          !EDITABLE_SHIPPING_DEMAND_FIELDS.has(key) &&
          !this.isReadonlyEchoField(key, dto, demand),
      )
      .map(([key]) => key);
    if (protectedFields.length > 0) {
      throw new BadRequestException({
        code: 'SHIPPING_DEMAND_PROTECTED_FIELDS',
        message: `发货需求编辑不允许修改受保护字段：${protectedFields.join(', ')}`,
      });
    }
    if (
      dto.contractFileKeys &&
      dto.contractFileNames &&
      dto.contractFileKeys.length !== dto.contractFileNames.length
    ) {
      throw new BadRequestException('合同文件 key 与名称数量不一致');
    }
  }

  private getProvidedDtoEntries(dto: UpdateShippingDemandDto) {
    return Object.entries(dto as Record<string, unknown>).filter(
      ([, value]) => value !== undefined,
    );
  }

  private isReadonlyEchoField(
    key: string,
    dto: UpdateShippingDemandDto,
    demand: ShippingDemand,
  ): boolean {
    if (!READONLY_ECHO_SHIPPING_DEMAND_FIELDS.has(key)) return false;
    const demandValue = demand[key as keyof ShippingDemand];
    return (
      (dto as Record<string, unknown>)[key] ===
      demandValue
    );
  }

  private buildUpdateData(
    dto: UpdateShippingDemandDto,
    operator?: string,
  ): Partial<ShippingDemand> {
    const data: Partial<ShippingDemand> = {};
    const providedValues = new Map(this.getProvidedDtoEntries(dto));
    for (const key of EDITABLE_SHIPPING_DEMAND_FIELDS) {
      if (!providedValues.has(key)) continue;
      const value = providedValues.get(key);
      (data as Record<string, unknown>)[key] = this.normalizeEditableValue(
        key,
        value,
      );
    }
    if (Object.keys(data).length > 0 && operator !== undefined) {
      data.updatedBy = operator;
    }
    return data;
  }

  private normalizeEditableValue(key: string, value: unknown) {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    if (key === 'exchangeRate') {
      return Number(value).toFixed(6);
    }
    return value;
  }

  private async prepareAllocationLines(
    queryRunner: QueryRunner,
    demand: ShippingDemand,
    dto: ConfirmShippingDemandAllocationDto,
  ): Promise<PreparedAllocationLine[]> {
    const items = demand.items ?? [];
    const dtoByItemId = new Map<
      number,
      ConfirmShippingDemandAllocationDto['items'][number]
    >();
    for (const line of dto.items ?? []) {
      if (dtoByItemId.has(line.itemId)) {
        throw new BadRequestException({
          code: 'DUPLICATE_ALLOCATION_ITEM',
          message: '发货需求明细不能重复提交',
        });
      }
      dtoByItemId.set(line.itemId, line);
    }
    if (dtoByItemId.size !== items.length) {
      throw new BadRequestException({
        code: 'ALLOCATION_ITEMS_INCOMPLETE',
        message: '所有发货需求明细都必须设置履行类型',
      });
    }

    const supplierSnapshots = new Map<number, PurchaseSupplierSnapshot>();

    return Promise.all(
      items.map(async (item) => {
        const input = dtoByItemId.get(Number(item.id));
        if (!input) {
          throw new BadRequestException({
            code: 'ALLOCATION_ITEM_MISSING',
            message: `${item.skuCode} 未设置履行类型`,
          });
        }
        const requiredQuantity = Number(item.requiredQuantity ?? 0);
        if (!Number.isInteger(requiredQuantity) || requiredQuantity <= 0) {
          throw new BadRequestException({
            code: 'INVALID_REQUIRED_QUANTITY',
            message: `${item.skuCode} 应发数量必须为正整数`,
          });
        }
        const stockQuantity = Number(input.stockQuantity ?? 0);
        if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
          throw new BadRequestException({
            code: 'INVALID_STOCK_QUANTITY',
            message: `${item.skuCode} 使用库存数量必须为非负整数`,
          });
        }
        if (stockQuantity > requiredQuantity) {
          throw new BadRequestException({
            code: 'STOCK_QUANTITY_EXCEEDS_REQUIRED',
            message: `${item.skuCode} 使用库存数量不能超过应发数量`,
          });
        }
        const purchaseQuantity = requiredQuantity - stockQuantity;
        this.assertFulfillmentQuantity(
          item,
          input.fulfillmentType,
          stockQuantity,
          purchaseQuantity,
        );
        const purchaseSupplier =
          purchaseQuantity > 0
            ? await this.getPurchaseSupplierSnapshot(
                queryRunner,
                input.purchaseSupplierId,
                supplierSnapshots,
                item,
              )
            : null;
        return {
          item,
          fulfillmentType: input.fulfillmentType,
          stockQuantity,
          purchaseQuantity,
          warehouseId: stockQuantity > 0 ? Number(input.warehouseId) : null,
          purchaseSupplier,
        };
      }),
    );
  }

  private async getPurchaseSupplierSnapshot(
    queryRunner: QueryRunner,
    supplierId: number | undefined,
    cache: Map<number, PurchaseSupplierSnapshot>,
    item: ShippingDemandItem,
  ): Promise<PurchaseSupplierSnapshot> {
    if (!supplierId) {
      throw new BadRequestException({
        code: 'PURCHASE_SUPPLIER_REQUIRED',
        message: `${item.skuCode} 涉及采购时必须选择采购供应商`,
      });
    }

    const cached = cache.get(supplierId);
    if (cached) return cached;

    const supplier = await queryRunner.manager.getRepository(Supplier).findOne({
      where: { id: supplierId },
      relations: { paymentTerms: true },
      order: { paymentTerms: { createdAt: 'ASC' } },
    });
    if (!supplier) {
      throw new BadRequestException({
        code: 'PURCHASE_SUPPLIER_NOT_FOUND',
        message: `${item.skuCode} 选择的采购供应商不存在`,
      });
    }

    const snapshot = {
      supplierId: Number(supplier.id),
      supplierName: supplier.name,
      supplierCode: supplier.supplierCode,
      contactPerson: supplier.contactPerson,
      contactPhone: supplier.contactPhone,
      contactEmail: supplier.contactEmail,
      paymentTermName: supplier.paymentTerms?.[0]?.paymentTermName ?? null,
    };
    cache.set(supplierId, snapshot);
    return snapshot;
  }

  private assertFulfillmentQuantity(
    item: ShippingDemandItem,
    fulfillmentType: FulfillmentType,
    stockQuantity: number,
    purchaseQuantity: number,
  ): void {
    if (
      fulfillmentType === FulfillmentType.FULL_PURCHASE &&
      stockQuantity !== 0
    ) {
      throw new BadRequestException({
        code: 'INVALID_FULL_PURCHASE_QUANTITY',
        message: `${item.skuCode} 全部采购时使用库存数量必须为 0`,
      });
    }
    if (
      fulfillmentType === FulfillmentType.USE_STOCK &&
      purchaseQuantity !== 0
    ) {
      throw new BadRequestException({
        code: 'INVALID_USE_STOCK_QUANTITY',
        message: `${item.skuCode} 使用现有库存时必须覆盖全部应发数量`,
      });
    }
    if (
      fulfillmentType === FulfillmentType.PARTIAL_PURCHASE &&
      (stockQuantity <= 0 || purchaseQuantity <= 0)
    ) {
      throw new BadRequestException({
        code: 'INVALID_PARTIAL_PURCHASE_QUANTITY',
        message: `${item.skuCode} 部分采购必须同时包含库存数量和采购数量`,
      });
    }
  }

  private async findSalesOrderForGeneration(
    queryRunner: QueryRunner,
    salesOrderId: number,
  ): Promise<SalesOrder> {
    const order = await queryRunner.manager
      .getRepository(SalesOrder)
      .createQueryBuilder('salesOrder')
      .leftJoinAndSelect('salesOrder.items', 'items')
      .setLock('pessimistic_write')
      .where('salesOrder.id = :salesOrderId', { salesOrderId })
      .orderBy('items.id', 'ASC')
      .getOne();

    if (!order) {
      throw new NotFoundException('销售订单不存在');
    }
    return order;
  }

  private assertGeneratable(order: SalesOrder): void {
    if (order.status !== SalesOrderStatus.APPROVED) {
      throw new BadRequestException('只有审核通过的销售订单可以生成发货需求');
    }
    if (!order.items?.length) {
      throw new BadRequestException('销售订单没有产品明细，无法生成发货需求');
    }
  }

  private async findActiveDemandForUpdate(
    queryRunner: QueryRunner,
    salesOrderId: number,
  ): Promise<ShippingDemand | null> {
    return queryRunner.manager
      .getRepository(ShippingDemand)
      .createQueryBuilder('demand')
      .setLock('pessimistic_write')
      .where('demand.sales_order_id = :salesOrderId', { salesOrderId })
      .andWhere('demand.status != :voided', {
        voided: ShippingDemandStatus.VOIDED,
      })
      .getOne();
  }

  private async writeSalesOrderStatusOperationLog(
    queryRunner: QueryRunner,
    order: SalesOrder,
    operator?: string,
  ): Promise<void> {
    const operationLogRepo = queryRunner.manager.getRepository(OperationLog);
    await operationLogRepo.save(
      operationLogRepo.create({
        operator: operator ?? 'system',
        operatorId: null,
        action: OperationLogAction.UPDATE,
        resourceType: 'sales-orders',
        resourceId: String(order.id),
        resourcePath: `/api/shipping-demands/generate-from-sales-order/${order.id}`,
        requestSummary: {
          sourceAction: 'generate_shipping_demand',
        },
        changeSummary: [
          {
            field: 'status',
            fieldLabel: '订单状态',
            oldValue: order.status,
            newValue: SalesOrderStatus.PREPARING,
          },
        ],
      }),
    );
  }

  private buildLockInventoryTransactions(
    repo: Repository<InventoryTransaction>,
    demand: ShippingDemand,
    item: ShippingDemandItem,
    warehouseId: number,
    summary: InventorySummary,
    allocations: Array<{ batchId: number; quantity: number }>,
    operator?: string,
  ): InventoryTransaction[] {
    const lockedQuantity = allocations.reduce(
      (sum, allocation) => sum + Number(allocation.quantity ?? 0),
      0,
    );
    if (lockedQuantity <= 0) return [];
    const afterActual = Number(summary.actualQuantity ?? 0);
    const afterLocked = Number(summary.lockedQuantity ?? 0);
    const afterAvailable = Number(summary.availableQuantity ?? 0);
    const beforeLocked = afterLocked - lockedQuantity;
    const beforeAvailable = afterAvailable + lockedQuantity;

    return [
      repo.create({
        skuId: Number(item.skuId),
        warehouseId,
        inventoryBatchId: null,
        changeType: InventoryChangeType.LOCK,
        actualQuantityDelta: 0,
        lockedQuantityDelta: lockedQuantity,
        availableQuantityDelta: -lockedQuantity,
        beforeActualQuantity: afterActual,
        afterActualQuantity: afterActual,
        beforeLockedQuantity: beforeLocked,
        afterLockedQuantity: afterLocked,
        beforeAvailableQuantity: beforeAvailable,
        afterAvailableQuantity: afterAvailable,
        sourceDocumentType: 'shipping_demand',
        sourceDocumentId: Number(demand.id),
        sourceDocumentItemId: Number(item.id),
        sourceActionKey: this.buildInventoryTransactionActionKey(demand, item),
        operatedBy: operator ?? 'system',
      }),
    ] as InventoryTransaction[];
  }

  private groupActiveAllocations(
    allocations: ShippingDemandInventoryAllocation[],
  ): ActiveAllocationGroup[] {
    const groupByKey = new Map<string, ActiveAllocationGroup>();
    for (const allocation of allocations) {
      const quantity = Number(allocation.lockedQuantity ?? 0);
      if (quantity <= 0) continue;
      const skuId = Number(allocation.skuId);
      const warehouseId = Number(allocation.warehouseId);
      const key = `${skuId}:${warehouseId}`;
      const group =
        groupByKey.get(key) ??
        ({
          skuId,
          warehouseId,
          allocations: [],
          quantity: 0,
        } satisfies ActiveAllocationGroup);
      group.allocations.push(allocation);
      group.quantity += quantity;
      groupByKey.set(key, group);
    }

    return [...groupByKey.values()].sort(
      (a, b) => a.skuId - b.skuId || a.warehouseId - b.warehouseId,
    );
  }

  private buildUnlockInventoryTransaction(
    repo: Repository<InventoryTransaction>,
    demand: ShippingDemand,
    group: ActiveAllocationGroup,
    summary: InventorySummary,
    operator?: string,
  ): InventoryTransaction {
    const afterActual = Number(summary.actualQuantity ?? 0);
    const afterLocked = Number(summary.lockedQuantity ?? 0);
    const afterAvailable = Number(summary.availableQuantity ?? 0);
    const unlockedQuantity = group.quantity;
    const sourceDocumentItemId = this.getSingleSourceDocumentItemId(group);

    return repo.create({
      skuId: group.skuId,
      warehouseId: group.warehouseId,
      inventoryBatchId: null,
      changeType: InventoryChangeType.UNLOCK,
      actualQuantityDelta: 0,
      lockedQuantityDelta: -unlockedQuantity,
      availableQuantityDelta: unlockedQuantity,
      beforeActualQuantity: afterActual,
      afterActualQuantity: afterActual,
      beforeLockedQuantity: afterLocked + unlockedQuantity,
      afterLockedQuantity: afterLocked,
      beforeAvailableQuantity: afterAvailable - unlockedQuantity,
      afterAvailableQuantity: afterAvailable,
      sourceDocumentType: 'shipping_demand',
      sourceDocumentId: Number(demand.id),
      sourceDocumentItemId,
      sourceActionKey: this.buildVoidInventoryTransactionActionKey(
        demand,
        group.skuId,
        group.warehouseId,
      ),
      operatedBy: operator ?? 'system',
    });
  }

  private getSingleSourceDocumentItemId(
    group: ActiveAllocationGroup,
  ): number | null {
    const itemIds = new Set(
      group.allocations.map((allocation) =>
        Number(allocation.shippingDemandItemId),
      ),
    );
    return itemIds.size === 1 ? [...itemIds][0] : null;
  }

  private async writeShippingDemandAllocationOperationLog(
    queryRunner: QueryRunner,
    demand: ShippingDemand,
    oldStatus: ShippingDemandStatus,
    newStatus: ShippingDemandStatus,
    lines: PreparedAllocationLine[],
    operator?: string,
  ): Promise<void> {
    const operationLogRepo = queryRunner.manager.getRepository(OperationLog);
    const allocationSummary = this.buildAllocationOperationSummary(lines);
    const allocationDetails = this.buildAllocationOperationDetails(lines);
    await operationLogRepo.save(
      operationLogRepo.create({
        operator: operator ?? 'system',
        operatorId: null,
        action: OperationLogAction.UPDATE,
        resourceType: 'shipping-demands',
        resourceId: String(demand.id),
        resourcePath: `/api/shipping-demands/${demand.id}/confirm-allocation`,
        requestSummary: {
          sourceAction: 'confirm_shipping_demand_allocation',
          lockedQuantity: lines.reduce(
            (sum, line) => sum + line.stockQuantity,
            0,
          ),
          purchaseQuantity: lines.reduce(
            (sum, line) => sum + line.purchaseQuantity,
            0,
          ),
          itemCount: lines.length,
          allocationSummary,
        },
        changeSummary: [
          {
            field: 'status',
            fieldLabel: '发货需求状态',
            oldValue: oldStatus,
            newValue: newStatus,
          },
          {
            field: 'allocationSummary',
            fieldLabel: '分配结果',
            oldValue: null,
            newValue: allocationSummary,
          },
          {
            field: 'allocationDetails',
            fieldLabel: '分配明细',
            oldValue: null,
            newValue: allocationDetails,
          },
        ],
      }),
    );
  }

  private async writeShippingDemandItemSupplierOperationLog(
    queryRunner: QueryRunner,
    demand: ShippingDemand,
    item: ShippingDemandItem,
    oldSupplierName: string | null,
    newSupplierName: string,
    operator?: string,
  ): Promise<void> {
    const operationLogRepo = queryRunner.manager.getRepository(OperationLog);
    await operationLogRepo.save(
      operationLogRepo.create({
        operator: operator ?? 'system',
        operatorId: null,
        action: OperationLogAction.UPDATE,
        resourceType: 'shipping-demands',
        resourceId: String(demand.id),
        resourcePath: `/api/shipping-demands/${demand.id}/items/${item.id}/purchase-supplier`,
        requestSummary: {
          sourceAction: 'update_shipping_demand_item_purchase_supplier',
          shippingDemandItemId: Number(item.id),
          skuCode: item.skuCode,
        },
        changeSummary: [
          {
            field: 'purchaseSupplier',
            fieldLabel: '采购供应商',
            oldValue: oldSupplierName,
            newValue: newSupplierName,
          },
        ],
      }),
    );
  }

  private async writeShippingDemandVoidOperationLog(
    queryRunner: QueryRunner,
    demand: ShippingDemand,
    oldStatus: ShippingDemandStatus,
    activeAllocations: ShippingDemandInventoryAllocation[],
    operator?: string,
  ): Promise<void> {
    const releasedQuantity = activeAllocations.reduce(
      (sum, allocation) => sum + Number(allocation.lockedQuantity ?? 0),
      0,
    );
    const operationLogRepo = queryRunner.manager.getRepository(OperationLog);
    await operationLogRepo.save(
      operationLogRepo.create({
        operator: operator ?? 'system',
        operatorId: null,
        action: OperationLogAction.UPDATE,
        resourceType: 'shipping-demands',
        resourceId: String(demand.id),
        resourcePath: `/api/shipping-demands/${demand.id}/void`,
        requestSummary: {
          sourceAction: 'void_shipping_demand',
          releasedQuantity,
          allocationCount: activeAllocations.length,
        },
        changeSummary: [
          {
            field: 'status',
            fieldLabel: '发货需求状态',
            oldValue: oldStatus,
            newValue: ShippingDemandStatus.VOIDED,
          },
          {
            field: 'releasedQuantity',
            fieldLabel: '释放锁定库存',
            oldValue: 0,
            newValue: releasedQuantity,
          },
        ],
      }),
    );
  }

  private async writeSalesOrderRollbackOperationLog(
    queryRunner: QueryRunner,
    order: SalesOrder,
    demand: ShippingDemand,
    operator?: string,
  ): Promise<void> {
    const operationLogRepo = queryRunner.manager.getRepository(OperationLog);
    await operationLogRepo.save(
      operationLogRepo.create({
        operator: operator ?? 'system',
        operatorId: null,
        action: OperationLogAction.UPDATE,
        resourceType: 'sales-orders',
        resourceId: String(order.id),
        resourcePath: `/api/shipping-demands/${demand.id}/void`,
        requestSummary: {
          sourceAction: 'void_shipping_demand',
          shippingDemandId: Number(demand.id),
          shippingDemandCode: demand.demandCode,
        },
        changeSummary: [
          {
            field: 'status',
            fieldLabel: '订单状态',
            oldValue: order.status,
            newValue: SalesOrderStatus.APPROVED,
          },
        ],
      }),
    );
  }

  private buildAllocationOperationSummary(
    lines: PreparedAllocationLine[],
  ): string {
    const lockedQuantity = lines.reduce(
      (sum, line) => sum + line.stockQuantity,
      0,
    );
    const purchaseQuantity = lines.reduce(
      (sum, line) => sum + line.purchaseQuantity,
      0,
    );
    const stockLineCount = lines.filter(
      (line) => line.stockQuantity > 0,
    ).length;
    const purchaseLineCount = lines.filter(
      (line) => line.purchaseQuantity > 0,
    ).length;

    return [
      `共 ${lines.length} 个 SKU`,
      `锁定现有库存 ${lockedQuantity}`,
      `需采购 ${purchaseQuantity}`,
      `使用库存 ${stockLineCount} 行`,
      `涉及采购 ${purchaseLineCount} 行`,
    ].join('；');
  }

  private buildAllocationOperationDetails(
    lines: PreparedAllocationLine[],
  ): string {
    return lines
      .map((line, index) => {
        const productName = line.item.productNameCn || line.item.productNameEn;
        const productText = productName ? ` / ${productName}` : '';
        const warehouseText = line.warehouseId
          ? `，仓库 ${line.warehouseId}`
          : '';
        const supplierText = line.purchaseSupplier
          ? `，采购供应商 ${line.purchaseSupplier.supplierName}`
          : '';

        return `${index + 1}. ${line.item.skuCode}${productText}：${FULFILLMENT_TYPE_LABELS[line.fulfillmentType] ?? line.fulfillmentType}，应发 ${line.item.requiredQuantity}，锁定库存 ${line.stockQuantity}，需采购 ${line.purchaseQuantity}${warehouseText}${supplierText}`;
      })
      .join('\n');
  }

  private buildAllocationActionKey(
    demand: ShippingDemand,
    item: ShippingDemandItem,
    batchId: number,
  ): string {
    return `shipping-demand:${demand.id}:confirm-allocation:item:${item.id}:batch:${batchId}`;
  }

  private buildInventoryTransactionActionKey(
    demand: ShippingDemand,
    item: ShippingDemandItem,
  ): string {
    return `shipping-demand:${demand.id}:confirm-allocation:item:${item.id}:lock`;
  }

  private buildVoidInventoryTransactionActionKey(
    demand: ShippingDemand,
    skuId: number,
    warehouseId: number,
  ): string {
    return `shipping-demand:${demand.id}:void:sku:${skuId}:warehouse:${warehouseId}`;
  }

  private async generateDemandCode(queryRunner: QueryRunner): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const prefix = `SD${year}${month}${day}`;
    const latest = await queryRunner.manager
      .getRepository(ShippingDemand)
      .createQueryBuilder('demand')
      .setLock('pessimistic_write')
      .where('demand.demand_code LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('demand.demand_code', 'DESC')
      .getOne();
    const lastNumber = latest?.demandCode
      ? Number(latest.demandCode.slice(prefix.length))
      : 0;
    return `${prefix}${String(lastNumber + 1).padStart(5, '0')}`;
  }

  private async executeWithDemandCodeRetry<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    let retryCount = 0;
    while (true) {
      const queryRunner = this.shippingDemandsRepository.createQueryRunner();
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
          this.isDuplicateEntryError(error) &&
          retryCount < MAX_DEMAND_CODE_RETRIES
        ) {
          retryCount += 1;
          await this.delay(INITIAL_RETRY_DELAY_MS * 2 ** (retryCount - 1));
          continue;
        }

        if (this.isDuplicateEntryError(error)) {
          throw new ConflictException({
            code: 'CONCURRENT_UPDATE',
            message: '发货需求编号并发生成失败，请稍后重试',
          });
        }

        throw error;
      } finally {
        await queryRunner.release();
      }
    }
  }

  private async executeWithConfirmAllocationRetry<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    let retryCount = 0;
    while (true) {
      const queryRunner = this.shippingDemandsRepository.createQueryRunner();
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
          retryCount < MAX_CONFIRM_ALLOCATION_RETRIES
        ) {
          retryCount += 1;
          await this.delay(
            INITIAL_CONFIRM_ALLOCATION_RETRY_DELAY_MS * 2 ** (retryCount - 1),
          );
          continue;
        }

        if (this.isRetryableConcurrencyError(error)) {
          throw new ConflictException({
            code: 'CONCURRENT_UPDATE',
            message: '库存并发更新失败，请稍后重试',
          });
        }

        throw error;
      } finally {
        await queryRunner.release();
      }
    }
  }

  private isDuplicateEntryError(error: unknown): boolean {
    const maybeError = error as { code?: string; errno?: number };
    return maybeError?.code === 'ER_DUP_ENTRY' || maybeError?.errno === 1062;
  }

  private isRetryableConcurrencyError(error: unknown): boolean {
    return this.isDeadlockError(error) || this.isDuplicateEntryError(error);
  }

  private isDeadlockError(error: unknown): boolean {
    const maybeError = error as { code?: string; errno?: number };
    return (
      maybeError?.code === 'ER_LOCK_DEADLOCK' || maybeError?.errno === 1213
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private groupAvailableInventoryBySkuId(items: AvailableInventoryItem[]) {
    const result = new Map<
      number,
      ShippingDemandItem['availableStockSnapshot']
    >();
    for (const item of items) {
      const skuId = Number(item.skuId);
      const rows = result.get(skuId) ?? [];
      rows.push({
        skuId,
        warehouseId:
          item.warehouseId === null ? null : Number(item.warehouseId),
        actualQuantity: Number(item.actualQuantity),
        lockedQuantity: Number(item.lockedQuantity),
        availableQuantity: Number(item.availableQuantity),
      });
      result.set(skuId, rows);
    }
    return result;
  }

  private async withSignedUrls(demand: ShippingDemand) {
    const contractFileUrls = demand.contractFileKeys
      ? await Promise.all(
          demand.contractFileKeys.map(async (key) => {
            try {
              return await this.filesService.getSignedUrl(key);
            } catch {
              return key;
            }
          }),
        )
      : null;
    const plugPhotoUrls = demand.plugPhotoKeys
      ? await Promise.all(
          demand.plugPhotoKeys.map(async (key) => {
            try {
              return await this.filesService.getSignedUrl(key);
            } catch {
              return key;
            }
          }),
        )
      : null;
    const shippingMarkTemplateUrl = demand.shippingMarkTemplateKey
      ? await this.filesService
          .getSignedUrl(demand.shippingMarkTemplateKey)
          .catch(() => demand.shippingMarkTemplateKey)
      : null;
    return {
      ...demand,
      contractFileUrls,
      plugPhotoUrls,
      shippingMarkTemplateUrl,
    };
  }
}
