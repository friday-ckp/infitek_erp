import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContractTemplateStatus,
  FulfillmentType,
  PurchaseOrderApplicationType,
  PurchaseOrderDemandType,
  PurchaseOrderReceiptStatus,
  PurchaseOrderSettlementDateType,
  PurchaseOrderStatus,
  PurchaseOrderType,
  SalesOrderType,
  ShippingDemandStatus,
  YesNo,
} from '@infitek/shared';
import { In, QueryRunner } from 'typeorm';
import {
  OperationLog,
  OperationLogAction,
} from '../operation-logs/entities/operation-log.entity';
import { Company } from '../master-data/companies/entities/company.entity';
import { ContractTemplate } from '../master-data/contract-templates/entities/contract-template.entity';
import { Currency } from '../master-data/currencies/entities/currency.entity';
import { Sku } from '../master-data/skus/entities/sku.entity';
import { Supplier } from '../master-data/suppliers/entities/supplier.entity';
import { User } from '../users/entities/user.entity';
import { ShippingDemandItem } from '../shipping-demands/entities/shipping-demand-item.entity';
import { ShippingDemand } from '../shipping-demands/entities/shipping-demand.entity';
import { CreatePurchaseOrdersFromShippingDemandDto } from './dto/create-from-shipping-demand.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrdersRepository } from './purchase-orders.repository';

const MAX_PURCHASE_ORDER_CODE_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 25;

interface PreparedDemandLine {
  item: ShippingDemandItem;
  quantity: number;
  unitPrice: number;
  availableToOrder: number;
}

interface PreparedStockLine {
  sku: Sku;
  quantity: number;
  unitPrice: number;
}

interface SupplierSnapshot {
  supplier: Supplier;
  paymentTermName: string | null;
}

interface CompanySnapshot {
  id: number;
  name: string;
  addressCn: string | null;
  signingLocation: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
}

interface CurrencySnapshot {
  id: number;
  code: string;
  name: string;
  symbol: string | null;
}

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly purchaseOrdersRepository: PurchaseOrdersRepository,
  ) {}

  findAll(query: QueryPurchaseOrderDto) {
    return this.purchaseOrdersRepository.findAll(query);
  }

  async findById(id: number): Promise<PurchaseOrder> {
    const order = await this.purchaseOrdersRepository.findById(id);
    if (!order) {
      throw new NotFoundException('采购订单不存在');
    }
    return order;
  }

  async getCreatePrefill(shippingDemandId: number) {
    const queryRunner = this.purchaseOrdersRepository.createQueryRunner();
    try {
      await queryRunner.connect();
      const demand = await this.findShippingDemandForPurchase(
        queryRunner,
        shippingDemandId,
      );
      return {
        shippingDemand: demand,
        items: this.buildDemandPrefillItems(demand),
      };
    } finally {
      await queryRunner.release();
    }
  }

  async createFromShippingDemand(
    dto: CreatePurchaseOrdersFromShippingDemandDto,
    operator?: string,
  ): Promise<PurchaseOrder[]> {
    const existing =
      await this.purchaseOrdersRepository.findBySourceActionKeyPrefix(
        dto.requestKey,
      );
    if (existing.length) {
      return existing;
    }

    const orderIds = await this.executeWithPurchaseOrderCodeRetry(
      async (queryRunner) => {
        const orders = await this.createFromShippingDemandInTransaction(
          queryRunner,
          dto,
          operator,
        );
        return orders.map((order) => Number(order.id));
      },
    );

    return Promise.all(orderIds.map((id) => this.findById(id)));
  }

  async create(dto: CreatePurchaseOrderDto, operator?: string) {
    const orderId = await this.executeWithPurchaseOrderCodeRetry(
      async (queryRunner) => {
        const order = await this.createStockOrderInTransaction(
          queryRunner,
          dto,
          operator,
        );
        return Number(order.id);
      },
    );

    return this.findById(orderId);
  }

  async confirmInternal(id: number, operator?: string) {
    return this.transitionStatus(
      id,
      PurchaseOrderStatus.PENDING_CONFIRM,
      PurchaseOrderStatus.SUPPLIER_CONFIRMING,
      '内部确认',
      'confirm_internal',
      operator,
    );
  }

  async confirmSupplier(id: number, operator?: string) {
    return this.transitionStatus(
      id,
      PurchaseOrderStatus.SUPPLIER_CONFIRMING,
      PurchaseOrderStatus.PENDING_RECEIPT,
      '供应商确认',
      'confirm_supplier',
      operator,
    );
  }

  private async createFromShippingDemandInTransaction(
    queryRunner: QueryRunner,
    dto: CreatePurchaseOrdersFromShippingDemandDto,
    operator?: string,
  ): Promise<PurchaseOrder[]> {
    const orderRepo = queryRunner.manager.getRepository(PurchaseOrder);
    const sourceActionKeys = dto.groups.map(
      (group) => `${dto.requestKey}:supplier:${group.supplierId}`,
    );
    const existingOrders = await orderRepo.find({
      where: { sourceActionKey: In(sourceActionKeys) },
      relations: { items: true },
      order: { id: 'ASC', items: { id: 'ASC' } },
    });
    if (existingOrders.length) {
      return existingOrders;
    }

    const demand = await this.findShippingDemandForPurchase(
      queryRunner,
      dto.shippingDemandId,
      true,
    );
    const itemRepo = queryRunner.manager.getRepository(PurchaseOrderItem);
    const preparedGroups = await this.prepareDemandGroups(
      queryRunner,
      demand,
      dto,
    );
    const companySnapshot = await this.resolveCompanySnapshot(
      queryRunner,
      demand.signingCompanyId ?? undefined,
    );
    const oldDemandStatus = demand.status;
    const savedOrders: PurchaseOrder[] = [];

    for (const group of preparedGroups) {
      const { supplierSnapshot, contract, lines } = group;
      const sourceActionKey = `${dto.requestKey}:supplier:${supplierSnapshot.supplier.id}`;
      const poCode = await this.generateOrderCode(queryRunner);
      const totalAmount = this.sumLineAmounts(lines);
      const totalQuantity = this.sumLineQuantities(lines);
      const savedOrder = await orderRepo.save(
        orderRepo.create({
          poCode,
          supplierId: Number(supplierSnapshot.supplier.id),
          supplierName: supplierSnapshot.supplier.name,
          supplierCode: supplierSnapshot.supplier.supplierCode,
          supplierNameText: supplierSnapshot.supplier.name,
          supplierContactPerson: supplierSnapshot.supplier.contactPerson,
          supplierContactPhone: supplierSnapshot.supplier.contactPhone,
          supplierContactEmail: supplierSnapshot.supplier.contactEmail,
          supplierPaymentTermName: supplierSnapshot.paymentTermName,
          supplierAddress: supplierSnapshot.supplier.address,
          poDeliveryDate: null,
          arrivalDate: null,
          isPrepaid: YesNo.NO,
          prepaidRatio: null,
          plugPhotoKeys: demand.plugPhotoKeys,
          shippingDemandId: Number(demand.id),
          shippingDemandCode: demand.demandCode,
          salesOrderId: Number(demand.salesOrderId),
          salesOrderCode: demand.sourceDocumentCode,
          purchaseCompanyId: companySnapshot?.id ?? demand.signingCompanyId,
          purchaseCompanyName:
            companySnapshot?.name ?? demand.signingCompanyName,
          companyAddressCn: companySnapshot?.addressCn ?? null,
          companySigningLocation: companySnapshot?.signingLocation ?? null,
          companyContactPerson: companySnapshot?.contactPerson ?? null,
          companyContactPhone: companySnapshot?.contactPhone ?? null,
          contractTermId: contract ? Number(contract.id) : null,
          contractTermName: contract?.name ?? null,
          contractTemplateIdText: contract ? String(contract.id) : null,
          orderType: PurchaseOrderType.REQUISITION,
          applicationType: PurchaseOrderApplicationType.SALES_REQUISITION,
          demandType: this.mapDemandType(demand.orderType),
          status: PurchaseOrderStatus.PENDING_CONFIRM,
          currencyId: demand.currencyId,
          currencyCode: demand.currencyCode,
          currencyName: demand.currencyName,
          currencySymbol: demand.currencySymbol,
          settlementDateType: PurchaseOrderSettlementDateType.ORDER_DATE,
          settlementType: null,
          purchaserId: lines[0]?.item.purchaserId ?? null,
          purchaserName: lines[0]?.item.purchaserName ?? null,
          salespersonName: demand.salespersonName,
          purchaseDate: this.currentDateString(),
          totalQuantity,
          totalAmount: this.decimal(totalAmount),
          paidAmount: this.decimal(0),
          receivedTotalQuantity: 0,
          receiptStatus: PurchaseOrderReceiptStatus.NOT_RECEIVED,
          isFullyPaid: YesNo.NO,
          supplierStampedContractKeys: null,
          bothStampedContractKeys: null,
          supplierContractUploaded: YesNo.NO,
          bothContractUploaded: YesNo.NO,
          remark: group.remark,
          businessRectificationRequirement: null,
          commercialRectificationRequirement: null,
          formErrorMessage: null,
          invoiceCompletedAt: null,
          paymentCompletedAt: null,
          sourceActionKey,
          createdBy: operator,
          updatedBy: operator,
        }),
      );

      await itemRepo.save(
        lines.map((line) =>
          itemRepo.create({
            purchaseOrderId: Number(savedOrder.id),
            shippingDemandId: Number(demand.id),
            shippingDemandItemId: Number(line.item.id),
            salesOrderItemId: Number(line.item.salesOrderItemId),
            skuId: Number(line.item.skuId),
            skuCode: line.item.skuCode,
            productNameCn: line.item.productNameCn,
            productNameEn: line.item.productNameEn,
            productType: line.item.lineType,
            manufacturerModel: null,
            plugType: line.item.plugType,
            skuSpecification: line.item.skuSpecification,
            unitId: line.item.unitId,
            unitName: line.item.unitName,
            listPrice: line.item.unitPrice,
            isInvoiced: YesNo.NO,
            quantity: line.quantity,
            receivedQuantity: 0,
            isFullyReceived: YesNo.NO,
            unitPrice: this.decimal(line.unitPrice),
            amount: this.decimal(line.quantity * line.unitPrice),
            spuId: line.item.spuId,
            spuName: line.item.spuName,
            electricalParams: line.item.electricalParams,
            coreParams: null,
            hasPlugText: this.formatYesNoText(line.item.hasPlug),
            specialAttributeNote: null,
            createdBy: operator,
            updatedBy: operator,
          }),
        ),
      );
      savedOrders.push(savedOrder);
    }

    await this.refreshPurchaseOrderedQuantity(
      queryRunner,
      (demand.items ?? []).map((item) => Number(item.id)),
      operator,
    );

    if (demand.status === ShippingDemandStatus.PENDING_PURCHASE_ORDER) {
      demand.status = ShippingDemandStatus.PURCHASING;
      if (operator !== undefined) {
        demand.updatedBy = operator;
      }
      await queryRunner.manager.getRepository(ShippingDemand).save(demand);
    }

    await this.writeCreateFromDemandOperationLogs(
      queryRunner,
      savedOrders,
      demand,
      oldDemandStatus,
      operator,
    );

    return savedOrders;
  }

  private async createStockOrderInTransaction(
    queryRunner: QueryRunner,
    dto: CreatePurchaseOrderDto,
    operator?: string,
  ): Promise<PurchaseOrder> {
    const orderRepo = queryRunner.manager.getRepository(PurchaseOrder);
    const itemRepo = queryRunner.manager.getRepository(PurchaseOrderItem);
    const supplierSnapshot = await this.getSupplierSnapshot(
      queryRunner,
      dto.supplierId,
    );
    const contract = await this.resolveContractTemplate(
      queryRunner,
      dto.contractTermId,
    );
    const companySnapshot = await this.resolveCompanySnapshot(
      queryRunner,
      dto.purchaseCompanyId,
    );
    const currencySnapshot = await this.resolveCurrencySnapshot(
      queryRunner,
      dto.currencyId,
    );
    const purchaser = await this.resolveUserSnapshot(
      queryRunner,
      dto.purchaserId,
    );
    const lines = await this.prepareStockLines(queryRunner, dto);
    const poCode = await this.generateOrderCode(queryRunner);
    const totalAmount = this.sumLineAmounts(lines);
    const totalQuantity = this.sumLineQuantities(lines);
    const sourceActionKey = dto.requestKey
      ? `${dto.requestKey}:stock:${dto.supplierId}`
      : null;

    if (sourceActionKey) {
      const existing = await orderRepo.findOne({
        where: { sourceActionKey },
        relations: { items: true },
      });
      if (existing) return existing;
    }

    const savedOrder = await orderRepo.save(
      orderRepo.create({
        poCode,
        supplierId: Number(supplierSnapshot.supplier.id),
        supplierName: supplierSnapshot.supplier.name,
        supplierCode: supplierSnapshot.supplier.supplierCode,
        supplierNameText: supplierSnapshot.supplier.name,
        supplierContactPerson: supplierSnapshot.supplier.contactPerson,
        supplierContactPhone: supplierSnapshot.supplier.contactPhone,
        supplierContactEmail: supplierSnapshot.supplier.contactEmail,
        supplierPaymentTermName: supplierSnapshot.paymentTermName,
        supplierAddress: supplierSnapshot.supplier.address,
        poDeliveryDate: dto.poDeliveryDate ?? null,
        arrivalDate: dto.arrivalDate ?? null,
        isPrepaid: dto.isPrepaid ?? YesNo.NO,
        prepaidRatio: dto.prepaidRatio ?? null,
        plugPhotoKeys: null,
        shippingDemandId: null,
        shippingDemandCode: null,
        salesOrderId: null,
        salesOrderCode: null,
        purchaseCompanyId: companySnapshot?.id ?? null,
        purchaseCompanyName: companySnapshot?.name ?? null,
        companyAddressCn: companySnapshot?.addressCn ?? null,
        companySigningLocation: companySnapshot?.signingLocation ?? null,
        companyContactPerson: companySnapshot?.contactPerson ?? null,
        companyContactPhone: companySnapshot?.contactPhone ?? null,
        contractTermId: contract ? Number(contract.id) : null,
        contractTermName: contract?.name ?? null,
        contractTemplateIdText: contract ? String(contract.id) : null,
        orderType: PurchaseOrderType.STOCK,
        applicationType:
          dto.applicationType ?? PurchaseOrderApplicationType.STOCK_PURCHASE,
        demandType: dto.demandType ?? null,
        status: PurchaseOrderStatus.PENDING_CONFIRM,
        currencyId: currencySnapshot?.id ?? null,
        currencyCode: currencySnapshot?.code ?? null,
        currencyName: currencySnapshot?.name ?? null,
        currencySymbol: currencySnapshot?.symbol ?? null,
        settlementDateType:
          dto.settlementDateType ?? PurchaseOrderSettlementDateType.ORDER_DATE,
        settlementType: dto.settlementType ?? null,
        purchaserId: purchaser?.id ?? null,
        purchaserName: purchaser?.name ?? null,
        salespersonName: null,
        purchaseDate: dto.purchaseDate ?? this.currentDateString(),
        totalQuantity,
        totalAmount: this.decimal(totalAmount),
        paidAmount: this.decimal(0),
        receivedTotalQuantity: 0,
        receiptStatus: PurchaseOrderReceiptStatus.NOT_RECEIVED,
        isFullyPaid: YesNo.NO,
        supplierStampedContractKeys: null,
        bothStampedContractKeys: null,
        supplierContractUploaded: YesNo.NO,
        bothContractUploaded: YesNo.NO,
        remark: dto.remark?.trim() || null,
        businessRectificationRequirement: null,
        commercialRectificationRequirement: null,
        formErrorMessage: null,
        invoiceCompletedAt: null,
        paymentCompletedAt: null,
        sourceActionKey,
        createdBy: operator,
        updatedBy: operator,
      }),
    );

    await itemRepo.save(
      lines.map((line) =>
        itemRepo.create({
          purchaseOrderId: Number(savedOrder.id),
          shippingDemandId: null,
          shippingDemandItemId: null,
          salesOrderItemId: null,
          skuId: Number(line.sku.id),
          skuCode: line.sku.skuCode,
          productNameCn: line.sku.nameCn,
          productNameEn: line.sku.nameEn,
          productType: line.sku.productType,
          manufacturerModel: line.sku.productModel,
          plugType: null,
          skuSpecification: line.sku.specification,
          unitId: line.sku.unitId,
          unitName: null,
          listPrice: null,
          isInvoiced: YesNo.NO,
          quantity: line.quantity,
          receivedQuantity: 0,
          isFullyReceived: YesNo.NO,
          unitPrice: this.decimal(line.unitPrice),
          amount: this.decimal(line.quantity * line.unitPrice),
          spuId: line.sku.spuId,
          spuName: null,
          electricalParams: line.sku.electricalParams,
          coreParams: line.sku.coreParams,
          hasPlugText:
            line.sku.hasPlug == null ? null : line.sku.hasPlug ? '是' : '否',
          specialAttributeNote: line.sku.specialAttributesNote,
          createdBy: operator,
          updatedBy: operator,
        }),
      ),
    );

    await this.writeCreateStockOrderOperationLog(
      queryRunner,
      savedOrder,
      lines,
      operator,
    );

    return savedOrder;
  }

  private async transitionStatus(
    id: number,
    expectedStatus: PurchaseOrderStatus,
    nextStatus: PurchaseOrderStatus,
    actionLabel: string,
    sourceAction: string,
    operator?: string,
  ): Promise<PurchaseOrder> {
    const orderId = await this.executeWithPurchaseOrderCodeRetry(
      async (queryRunner) => {
        const orderRepo = queryRunner.manager.getRepository(PurchaseOrder);
        const order = await orderRepo
          .createQueryBuilder('purchaseOrder')
          .where('purchaseOrder.id = :id', { id })
          .setLock('pessimistic_write')
          .getOne();
        if (!order) {
          throw new NotFoundException('采购订单不存在');
        }
        if (order.status !== expectedStatus) {
          throw new BadRequestException({
            code: 'PURCHASE_ORDER_STATUS_INVALID',
            message: `当前采购订单状态不允许${actionLabel}`,
          });
        }
        const oldStatus = order.status;
        order.status = nextStatus;
        if (operator !== undefined) {
          order.updatedBy = operator;
        }
        const saved = await orderRepo.save(order);
        await this.writeStatusOperationLog(
          queryRunner,
          saved,
          oldStatus,
          nextStatus,
          sourceAction,
          actionLabel,
          operator,
        );
        return Number(saved.id);
      },
    );

    return this.findById(orderId);
  }

  private async findShippingDemandForPurchase(
    queryRunner: QueryRunner,
    shippingDemandId: number,
    lock = false,
  ): Promise<ShippingDemand> {
    const qb = queryRunner.manager
      .getRepository(ShippingDemand)
      .createQueryBuilder('demand')
      .leftJoinAndSelect('demand.items', 'items')
      .where('demand.id = :shippingDemandId', { shippingDemandId })
      .orderBy('items.id', 'ASC');

    if (lock) {
      qb.setLock('pessimistic_write');
    }

    const demand = await qb.getOne();
    if (!demand) {
      throw new NotFoundException('发货需求不存在');
    }
    if (
      demand.status !== ShippingDemandStatus.PENDING_PURCHASE_ORDER &&
      demand.status !== ShippingDemandStatus.PURCHASING
    ) {
      throw new BadRequestException({
        code: 'PURCHASE_ORDER_DEMAND_STATUS_INVALID',
        message: '只有待生成采购单或采购中的发货需求可以生成采购订单',
      });
    }
    if (!this.buildDemandPrefillItems(demand).length) {
      throw new BadRequestException({
        code: 'NO_PURCHASE_QUANTITY_TO_ORDER',
        message: '当前发货需求没有可下单的采购数量',
      });
    }
    return demand;
  }

  private buildDemandPrefillItems(demand: ShippingDemand) {
    return (demand.items ?? [])
      .map((item) => {
        const purchaseRequiredQuantity = Number(
          item.purchaseRequiredQuantity ?? 0,
        );
        const purchaseOrderedQuantity = Number(
          item.purchaseOrderedQuantity ?? 0,
        );
        const availableToOrder = Math.max(
          0,
          purchaseRequiredQuantity - purchaseOrderedQuantity,
        );
        return {
          shippingDemandItemId: Number(item.id),
          skuId: Number(item.skuId),
          skuCode: item.skuCode,
          productNameCn: item.productNameCn,
          productNameEn: item.productNameEn,
          skuSpecification: item.skuSpecification,
          unitId: item.unitId,
          unitName: item.unitName,
          fulfillmentType: item.fulfillmentType,
          purchaseRequiredQuantity,
          purchaseOrderedQuantity,
          availableToOrder,
          quantity: availableToOrder,
          purchaseSupplierId: item.purchaseSupplierId,
          purchaseSupplierName: item.purchaseSupplierName,
          purchaseSupplierCode: item.purchaseSupplierCode,
          purchaseSupplierContactPerson: item.purchaseSupplierContactPerson,
          purchaseSupplierContactPhone: item.purchaseSupplierContactPhone,
          purchaseSupplierContactEmail: item.purchaseSupplierContactEmail,
          purchaseSupplierPaymentTermName: item.purchaseSupplierPaymentTermName,
        };
      })
      .filter(
        (item) =>
          item.availableToOrder > 0 &&
          (item.fulfillmentType === FulfillmentType.FULL_PURCHASE ||
            item.fulfillmentType === FulfillmentType.PARTIAL_PURCHASE),
      );
  }

  private async prepareDemandGroups(
    queryRunner: QueryRunner,
    demand: ShippingDemand,
    dto: CreatePurchaseOrdersFromShippingDemandDto,
  ) {
    const itemById = new Map(
      (demand.items ?? []).map((item) => [Number(item.id), item]),
    );
    const purchaseOrderedByItemId =
      await this.sumActivePurchaseQuantityByDemandItemIdsInTransaction(
        queryRunner,
        [...itemById.keys()],
      );
    const seenSupplierIds = new Set<number>();
    const seenItemIds = new Set<number>();

    return Promise.all(
      dto.groups.map(async (group) => {
        if (seenSupplierIds.has(group.supplierId)) {
          throw new BadRequestException({
            code: 'DUPLICATE_PURCHASE_ORDER_SUPPLIER',
            message: '同一次创建中供应商不能重复分组',
          });
        }
        seenSupplierIds.add(group.supplierId);

        const supplierSnapshot = await this.getSupplierSnapshot(
          queryRunner,
          group.supplierId,
        );
        const contract = await this.resolveContractTemplate(
          queryRunner,
          group.contractTermId,
        );
        const lines = group.items.map((line): PreparedDemandLine => {
          if (seenItemIds.has(line.shippingDemandItemId)) {
            throw new BadRequestException({
              code: 'DUPLICATE_PURCHASE_ORDER_DEMAND_ITEM',
              message: '同一发货需求明细不能重复下单',
            });
          }
          seenItemIds.add(line.shippingDemandItemId);
          const item = itemById.get(line.shippingDemandItemId);
          if (!item) {
            throw new BadRequestException({
              code: 'PURCHASE_ORDER_ITEM_NOT_IN_DEMAND',
              message: '采购订单明细必须来自当前发货需求',
            });
          }
          if (
            item.fulfillmentType !== FulfillmentType.FULL_PURCHASE &&
            item.fulfillmentType !== FulfillmentType.PARTIAL_PURCHASE
          ) {
            throw new BadRequestException({
              code: 'PURCHASE_ORDER_ITEM_FULFILLMENT_INVALID',
              message: `${item.skuCode} 不是采购履行类型，不能生成采购订单`,
            });
          }
          if (!item.purchaseSupplierId) {
            throw new BadRequestException({
              code: 'PURCHASE_ORDER_ITEM_SUPPLIER_REQUIRED',
              message: `${item.skuCode} 缺少采购供应商，请先回到发货需求明细完成分配`,
            });
          }
          if (Number(item.purchaseSupplierId) !== Number(group.supplierId)) {
            throw new BadRequestException({
              code: 'PURCHASE_ORDER_ITEM_SUPPLIER_MISMATCH',
              message: `${item.skuCode} 采购供应商与采购单分组供应商不一致`,
            });
          }
          const purchaseOrderedQuantity = Math.max(
            Number(item.purchaseOrderedQuantity ?? 0),
            purchaseOrderedByItemId.get(Number(item.id)) ?? 0,
          );
          const availableToOrder =
            Number(item.purchaseRequiredQuantity ?? 0) -
            purchaseOrderedQuantity;
          if (availableToOrder <= 0) {
            throw new BadRequestException({
              code: 'NO_PURCHASE_QUANTITY_TO_ORDER',
              message: `${item.skuCode} 没有可下单的采购数量`,
            });
          }
          if (line.quantity > availableToOrder) {
            throw new BadRequestException({
              code: 'PURCHASE_QUANTITY_EXCEEDS_REQUIRED',
              message: `${item.skuCode} 本次下单数量不能超过可下单数量 ${availableToOrder}`,
            });
          }
          return {
            item,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            availableToOrder,
          };
        });

        return {
          supplierSnapshot,
          contract,
          lines,
          remark: group.remark?.trim() || null,
        };
      }),
    );
  }

  private async prepareStockLines(
    queryRunner: QueryRunner,
    dto: CreatePurchaseOrderDto,
  ): Promise<PreparedStockLine[]> {
    const seenSkuIds = new Set<number>();
    const skuRepo = queryRunner.manager.getRepository(Sku);
    return Promise.all(
      dto.items.map(async (line) => {
        if (seenSkuIds.has(line.skuId)) {
          throw new BadRequestException({
            code: 'DUPLICATE_PURCHASE_ORDER_SKU',
            message: '同一采购订单中 SKU 不能重复',
          });
        }
        seenSkuIds.add(line.skuId);
        const sku = await skuRepo.findOne({ where: { id: line.skuId } });
        if (!sku) {
          throw new BadRequestException({
            code: 'PURCHASE_ORDER_SKU_NOT_FOUND',
            message: `SKU #${line.skuId} 不存在`,
          });
        }
        return {
          sku,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        };
      }),
    );
  }

  private async getSupplierSnapshot(
    queryRunner: QueryRunner,
    supplierId: number,
  ): Promise<SupplierSnapshot> {
    const supplier = await queryRunner.manager.getRepository(Supplier).findOne({
      where: { id: supplierId },
      relations: { paymentTerms: true },
      order: { paymentTerms: { createdAt: 'ASC' } },
    });
    if (!supplier) {
      throw new BadRequestException({
        code: 'PURCHASE_ORDER_SUPPLIER_NOT_FOUND',
        message: '供应商不存在',
      });
    }
    return {
      supplier,
      paymentTermName: supplier.paymentTerms?.[0]?.paymentTermName ?? null,
    };
  }

  private async resolveContractTemplate(
    queryRunner: QueryRunner,
    contractTermId?: number,
  ): Promise<ContractTemplate | null> {
    const contractRepo = queryRunner.manager.getRepository(ContractTemplate);
    if (contractTermId) {
      const contract = await contractRepo.findOne({
        where: { id: contractTermId },
      });
      if (!contract) {
        throw new BadRequestException({
          code: 'PURCHASE_ORDER_CONTRACT_NOT_FOUND',
          message: '合同条款范本不存在',
        });
      }
      if (contract.status !== ContractTemplateStatus.APPROVED) {
        throw new BadRequestException({
          code: 'PURCHASE_ORDER_CONTRACT_NOT_APPROVED',
          message: '只能引用已审批的合同条款范本',
        });
      }
      return contract;
    }

    return contractRepo.findOne({
      where: { status: ContractTemplateStatus.APPROVED },
      order: { isDefault: 'DESC', updatedAt: 'DESC' },
    });
  }

  private async refreshPurchaseOrderedQuantity(
    queryRunner: QueryRunner,
    demandItemIds: number[],
    operator?: string,
  ): Promise<void> {
    if (!demandItemIds.length) return;
    const purchaseOrderedByItemId =
      await this.sumActivePurchaseQuantityByDemandItemIdsInTransaction(
        queryRunner,
        demandItemIds,
      );
    const itemRepo = queryRunner.manager.getRepository(ShippingDemandItem);
    const items = await itemRepo.find({ where: { id: In(demandItemIds) } });
    for (const item of items) {
      item.purchaseOrderedQuantity =
        purchaseOrderedByItemId.get(Number(item.id)) ?? 0;
      if (operator !== undefined) {
        item.updatedBy = operator;
      }
    }
    await itemRepo.save(items);
  }

  private async sumActivePurchaseQuantityByDemandItemIdsInTransaction(
    queryRunner: QueryRunner,
    demandItemIds: number[],
  ): Promise<Map<number, number>> {
    if (!demandItemIds.length) return new Map();
    const rows = await queryRunner.manager
      .getRepository(PurchaseOrderItem)
      .createQueryBuilder('item')
      .innerJoin('item.purchaseOrder', 'purchaseOrder')
      .select('item.shipping_demand_item_id', 'shippingDemandItemId')
      .addSelect('SUM(item.quantity)', 'quantity')
      .where('item.shipping_demand_item_id IN (:...demandItemIds)', {
        demandItemIds,
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
        quantity: string;
      }>();

    return new Map(
      rows.map((row) => [
        Number(row.shippingDemandItemId),
        Number(row.quantity ?? 0),
      ]),
    );
  }

  private async generateOrderCode(queryRunner: QueryRunner): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const prefix = `XCPO${year}${month}${day}`;
    const latest = await queryRunner.manager
      .getRepository(PurchaseOrder)
      .createQueryBuilder('purchaseOrder')
      .setLock('pessimistic_write')
      .where('purchaseOrder.po_code LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('purchaseOrder.po_code', 'DESC')
      .getOne();
    const lastNumber = latest?.poCode
      ? Number(latest.poCode.slice(prefix.length))
      : 0;
    return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`;
  }

  private sumLineAmounts(
    lines: Array<{ quantity: number; unitPrice: number }>,
  ) {
    return lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  }

  private sumLineQuantities(lines: Array<{ quantity: number }>) {
    return lines.reduce((sum, line) => sum + Number(line.quantity ?? 0), 0);
  }

  private currentDateString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private mapDemandType(
    orderType?: SalesOrderType | null,
  ): PurchaseOrderDemandType | null {
    if (orderType === SalesOrderType.SALES)
      return PurchaseOrderDemandType.SALES_ORDER;
    if (orderType === SalesOrderType.AFTER_SALES)
      return PurchaseOrderDemandType.AFTER_SALES_ORDER;
    if (orderType === SalesOrderType.SAMPLE)
      return PurchaseOrderDemandType.EXHIBITION_SAMPLE_ORDER;
    return null;
  }

  private formatYesNoText(value?: YesNo | null): string | null {
    if (value === YesNo.YES) return '是';
    if (value === YesNo.NO) return '否';
    return null;
  }

  private async resolveCompanySnapshot(
    queryRunner: QueryRunner,
    companyId?: number,
  ): Promise<CompanySnapshot | null> {
    if (!companyId) return null;
    const company = await queryRunner.manager.getRepository(Company).findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new BadRequestException({
        code: 'PURCHASE_ORDER_COMPANY_NOT_FOUND',
        message: '采购主体不存在',
      });
    }
    return {
      id: Number(company.id),
      name: company.nameCn,
      addressCn: company.addressCn,
      signingLocation: company.signingLocation,
      contactPerson: company.contactPerson,
      contactPhone: company.contactPhone,
    };
  }

  private async resolveCurrencySnapshot(
    queryRunner: QueryRunner,
    currencyId?: number,
  ): Promise<CurrencySnapshot | null> {
    if (!currencyId) return null;
    const currency = await queryRunner.manager.getRepository(Currency).findOne({
      where: { id: currencyId },
    });
    if (!currency) {
      throw new BadRequestException({
        code: 'PURCHASE_ORDER_CURRENCY_NOT_FOUND',
        message: '币种不存在',
      });
    }
    return {
      id: Number(currency.id),
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
    };
  }

  private async resolveUserSnapshot(
    queryRunner: QueryRunner,
    userId?: number,
  ): Promise<{ id: number; name: string } | null> {
    if (!userId) return null;
    const user = await queryRunner.manager.getRepository(User).findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException({
        code: 'PURCHASE_ORDER_PURCHASER_NOT_FOUND',
        message: '采购员不存在',
      });
    }
    return {
      id: Number(user.id),
      name: user.name,
    };
  }

  private decimal(value: number): string {
    return value.toFixed(2);
  }

  private async writeCreateFromDemandOperationLogs(
    queryRunner: QueryRunner,
    orders: PurchaseOrder[],
    demand: ShippingDemand,
    oldDemandStatus: ShippingDemandStatus,
    operator?: string,
  ) {
    const operationLogRepo = queryRunner.manager.getRepository(OperationLog);
    const totalAmount = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount ?? 0),
      0,
    );
    await operationLogRepo.save(
      orders.map((order) =>
        operationLogRepo.create({
          operator: operator ?? 'system',
          operatorId: null,
          action: OperationLogAction.CREATE,
          resourceType: 'purchase-orders',
          resourceId: String(order.id),
          resourcePath: '/api/purchase-orders/from-shipping-demand',
          requestSummary: {
            sourceAction: 'create_purchase_order_from_shipping_demand',
            shippingDemandId: Number(demand.id),
            shippingDemandCode: demand.demandCode,
            supplierId: Number(order.supplierId),
            totalAmount: order.totalAmount,
          },
          changeSummary: [
            {
              field: 'status',
              fieldLabel: '采购订单状态',
              oldValue: null,
              newValue: PurchaseOrderStatus.PENDING_CONFIRM,
            },
          ],
        }),
      ),
    );
    if (oldDemandStatus !== demand.status) {
      await operationLogRepo.save(
        operationLogRepo.create({
          operator: operator ?? 'system',
          operatorId: null,
          action: OperationLogAction.UPDATE,
          resourceType: 'shipping-demands',
          resourceId: String(demand.id),
          resourcePath: '/api/purchase-orders/from-shipping-demand',
          requestSummary: {
            sourceAction: 'purchase_order_created',
            purchaseOrderCount: orders.length,
            totalAmount: this.decimal(totalAmount),
          },
          changeSummary: [
            {
              field: 'status',
              fieldLabel: '发货需求状态',
              oldValue: oldDemandStatus,
              newValue: demand.status,
            },
          ],
        }),
      );
    }
  }

  private async writeCreateStockOrderOperationLog(
    queryRunner: QueryRunner,
    order: PurchaseOrder,
    lines: PreparedStockLine[],
    operator?: string,
  ) {
    const operationLogRepo = queryRunner.manager.getRepository(OperationLog);
    await operationLogRepo.save(
      operationLogRepo.create({
        operator: operator ?? 'system',
        operatorId: null,
        action: OperationLogAction.CREATE,
        resourceType: 'purchase-orders',
        resourceId: String(order.id),
        resourcePath: '/api/purchase-orders',
        requestSummary: {
          sourceAction: 'create_stock_purchase_order',
          supplierId: Number(order.supplierId),
          itemCount: lines.length,
          totalAmount: order.totalAmount,
        },
        changeSummary: [
          {
            field: 'status',
            fieldLabel: '采购订单状态',
            oldValue: null,
            newValue: PurchaseOrderStatus.PENDING_CONFIRM,
          },
        ],
      }),
    );
  }

  private async writeStatusOperationLog(
    queryRunner: QueryRunner,
    order: PurchaseOrder,
    oldStatus: PurchaseOrderStatus,
    newStatus: PurchaseOrderStatus,
    sourceAction: string,
    actionLabel: string,
    operator?: string,
  ) {
    const operationLogRepo = queryRunner.manager.getRepository(OperationLog);
    await operationLogRepo.save(
      operationLogRepo.create({
        operator: operator ?? 'system',
        operatorId: null,
        action: OperationLogAction.UPDATE,
        resourceType: 'purchase-orders',
        resourceId: String(order.id),
        resourcePath: `/api/purchase-orders/${order.id}/${sourceAction}`,
        requestSummary: {
          sourceAction,
          actionLabel,
          poCode: order.poCode,
        },
        changeSummary: [
          {
            field: 'status',
            fieldLabel: '采购订单状态',
            oldValue: oldStatus,
            newValue: newStatus,
          },
        ],
      }),
    );
  }

  private async executeWithPurchaseOrderCodeRetry<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    let retryCount = 0;
    while (true) {
      const queryRunner = this.purchaseOrdersRepository.createQueryRunner();
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
          retryCount < MAX_PURCHASE_ORDER_CODE_RETRIES
        ) {
          retryCount += 1;
          await this.delay(INITIAL_RETRY_DELAY_MS * 2 ** (retryCount - 1));
          continue;
        }

        if (this.isRetryableConcurrencyError(error)) {
          throw new ConflictException({
            code: 'CONCURRENT_UPDATE',
            message: '采购订单并发创建失败，请稍后重试',
          });
        }

        throw error;
      } finally {
        await queryRunner.release();
      }
    }
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

  private isDuplicateEntryError(error: unknown): boolean {
    const maybeError = error as { code?: string; errno?: number };
    return maybeError?.code === 'ER_DUP_ENTRY' || maybeError?.errno === 1062;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
