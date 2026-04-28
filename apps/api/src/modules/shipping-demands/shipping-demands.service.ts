import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SalesOrderStatus, ShippingDemandStatus } from '@infitek/shared';
import { QueryRunner } from 'typeorm';
import { FilesService } from '../../files/files.service';
import { InventoryService, type AvailableInventoryItem } from '../inventory/inventory.service';
import {
  OperationLog,
  OperationLogAction,
} from '../operation-logs/entities/operation-log.entity';
import { SalesOrder } from '../sales-orders/entities/sales-order.entity';
import { SalesOrderItem } from '../sales-orders/entities/sales-order-item.entity';
import { QueryShippingDemandDto } from './dto/query-shipping-demand.dto';
import { ShippingDemandItem } from './entities/shipping-demand-item.entity';
import { ShippingDemand } from './entities/shipping-demand.entity';
import { ShippingDemandsRepository } from './shipping-demands.repository';

const MAX_DEMAND_CODE_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 50;

@Injectable()
export class ShippingDemandsService {
  constructor(
    private readonly shippingDemandsRepository: ShippingDemandsRepository,
    private readonly inventoryService: InventoryService,
    private readonly filesService: FilesService,
  ) {}

  async findById(id: number): Promise<ShippingDemand & Record<string, unknown>> {
    const demand = await this.shippingDemandsRepository.findById(id);
    if (!demand) {
      throw new NotFoundException('发货需求不存在');
    }
    return this.withSignedUrls(demand);
  }

  findAll(query: QueryShippingDemandDto) {
    return this.shippingDemandsRepository.findAll(query);
  }

  async generateFromSalesOrder(
    salesOrderId: number,
    operator?: string,
  ): Promise<ShippingDemand> {
    const demandId = await this.executeWithDemandCodeRetry(async (queryRunner) => {
      const savedDemand = await this.generateFromSalesOrderInTransaction(
        queryRunner,
        salesOrderId,
        operator,
      );

      return Number(savedDemand.id);
    });

    return this.findById(demandId);
  }

  private async generateFromSalesOrderInTransaction(
    queryRunner: QueryRunner,
    salesOrderId: number,
    operator?: string,
  ): Promise<ShippingDemand> {
    const order = await this.findSalesOrderForGeneration(queryRunner, salesOrderId);

    const existingDemand = await this.findActiveDemandForUpdate(queryRunner, salesOrderId);
    if (existingDemand) {
      throw new BadRequestException('该销售订单已存在未作废的发货需求');
    }

    this.assertGeneratable(order);

    const demandCode = await this.generateDemandCode(queryRunner);
    const skuIds = [...new Set((order.items ?? []).map((item) => Number(item.skuId)))];
    const availableInventory = await this.inventoryService.findAvailable({ skuIds });
    const availableBySkuId = this.groupAvailableInventoryBySkuId(availableInventory);

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

    await queryRunner.manager.getRepository(SalesOrder).update(Number(order.id), {
      status: SalesOrderStatus.PREPARING,
      updatedBy: operator,
    });
    await this.writeSalesOrderStatusOperationLog(queryRunner, order, operator);

    return savedDemand;
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
      .andWhere('demand.status != :voided', { voided: ShippingDemandStatus.VOIDED })
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
    const lastNumber = latest?.demandCode ? Number(latest.demandCode.slice(prefix.length)) : 0;
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

        if (this.isDuplicateEntryError(error) && retryCount < MAX_DEMAND_CODE_RETRIES) {
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

  private isDuplicateEntryError(error: unknown): boolean {
    const maybeError = error as { code?: string; errno?: number };
    return maybeError?.code === 'ER_DUP_ENTRY' || maybeError?.errno === 1062;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private groupAvailableInventoryBySkuId(items: AvailableInventoryItem[]) {
    const result = new Map<number, ShippingDemandItem['availableStockSnapshot']>();
    for (const item of items) {
      const skuId = Number(item.skuId);
      const rows = result.get(skuId) ?? [];
      rows.push({
        skuId,
        warehouseId: item.warehouseId === null ? null : Number(item.warehouseId),
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
