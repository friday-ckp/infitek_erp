import { BadRequestException } from '@nestjs/common';
import {
  DomesticTradeType,
  FulfillmentType,
  InventoryChangeType,
  SalesOrderStatus,
  SalesOrderSource,
  SalesOrderType,
  ShippingDemandAllocationStatus,
  ShippingDemandStatus,
  YesNo,
} from '@infitek/shared';
import { InventoryTransaction } from '../../inventory/entities/inventory-transaction.entity';
import {
  OperationLog,
  OperationLogAction,
} from '../../operation-logs/entities/operation-log.entity';
import { Supplier } from '../../master-data/suppliers/entities/supplier.entity';
import { SalesOrder } from '../../sales-orders/entities/sales-order.entity';
import { SalesOrderItem } from '../../sales-orders/entities/sales-order-item.entity';
import { ShippingDemandInventoryAllocation } from '../entities/shipping-demand-inventory-allocation.entity';
import { ShippingDemandItem } from '../entities/shipping-demand-item.entity';
import { ShippingDemand } from '../entities/shipping-demand.entity';
import { UpdateShippingDemandDto } from '../dto/update-shipping-demand.dto';
import { ShippingDemandsService } from '../shipping-demands.service';

describe('ShippingDemandsService', () => {
  const shippingDemandsRepository = {
    createQueryRunner: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  };
  const inventoryService = {
    findAvailable: jest.fn(),
    lockStockInTransaction: jest.fn(),
    unlockStockInTransaction: jest.fn(),
  };
  const filesService = {
    getSignedUrl: jest.fn(),
  };

  const makeOrder = (
    status = SalesOrderStatus.APPROVED,
  ): Partial<SalesOrder> => ({
    id: 10,
    erpSalesOrderCode: 'SO2026042800001',
    externalOrderCode: 'EXT-001',
    orderSource: SalesOrderSource.MANUAL,
    status,
    orderType: SalesOrderType.SALES,
    domesticTradeType: DomesticTradeType.FOREIGN,
    customerId: 1,
    customerName: '测试客户',
    customerCode: 'KH001',
    customerContactPerson: '张三',
    afterSalesSourceOrderId: null,
    afterSalesSourceOrderCode: null,
    afterSalesProductSummary: null,
    currencyId: 2,
    currencyCode: 'USD',
    currencyName: '美元',
    currencySymbol: '$',
    tradeTerm: null,
    bankAccount: 'BOC-001',
    extraViewerId: null,
    extraViewerName: null,
    primaryIndustry: null,
    secondaryIndustry: null,
    exchangeRate: '7.100000',
    crmSignedAt: '2026-04-27',
    paymentTerm: null,
    shipmentOriginCountryId: null,
    shipmentOriginCountryName: null,
    destinationCountryId: null,
    destinationCountryName: null,
    destinationPortId: null,
    destinationPortName: null,
    signingCompanyId: null,
    signingCompanyName: null,
    salespersonId: null,
    salespersonName: null,
    merchandiserId: null,
    merchandiserName: null,
    merchandiserAbbr: null,
    orderNature: null,
    receiptStatus: null,
    transportationMethod: null,
    requiredDeliveryAt: null,
    isSharedOrder: null,
    isSinosure: null,
    isAliTradeAssurance: null,
    isInsured: null,
    isPalletized: null,
    isSplitInAdvance: YesNo.NO,
    requiresExportCustoms: null,
    requiresWarrantyCard: null,
    requiresCustomsCertificate: null,
    requiresMaternityHandover: null,
    customsDeclarationMethod: null,
    usesMarketingFund: null,
    aliTradeAssuranceOrderCode: null,
    forwarderQuoteNote: '询价货代备注',
    contractFileKeys: ['contracts/a.pdf'],
    contractFileNames: ['合同A.pdf'],
    plugPhotoKeys: ['plugs/a.png'],
    consigneeCompany: 'Consignee Co.',
    consigneeOtherInfo: 'Consignee Info',
    notifyCompany: 'Notify Co.',
    notifyOtherInfo: 'Notify Info',
    shipperCompany: 'Shipper Co.',
    shipperOtherInfoCompanyId: null,
    shipperOtherInfoCompanyName: null,
    domesticCustomerCompany: null,
    domesticCustomerDeliveryInfo: null,
    usesDefaultShippingMark: YesNo.YES,
    shippingMarkNote: '唛头备注',
    shippingMarkTemplateKey: 'shipping-mark/a.docx',
    needsInvoice: YesNo.YES,
    invoiceType: null,
    shippingDocumentsNote: '随货文件',
    blType: null,
    originalMailAddress: 'Mail address',
    businessRectificationNote: '业务整改',
    customsDocumentNote: '清关要求',
    otherRequirementNote: '其他要求',
    contractAmount: '1000.00',
    receivedAmount: '0.00',
    outstandingAmount: '1000.00',
    productTotalAmount: '600.00',
    expenseTotalAmount: '0.00',
    totalAmount: '600.00',
    items: [
      {
        id: 101,
        skuId: 11,
        skuCode: 'SKU001',
        productNameCn: '离心机',
        productNameEn: 'Centrifuge',
        lineType: null,
        spuId: 99,
        spuName: 'SPU#99',
        electricalParams: '220V',
        hasPlug: null,
        plugType: null,
        unitPrice: '300.00',
        currencyId: 2,
        currencyCode: 'USD',
        unitId: 6,
        unitName: '台',
        purchaserId: 8,
        purchaserName: '采购员A',
        needsPurchase: YesNo.YES,
        quantity: 2,
        amount: '600.00',
        material: '金属',
        imageUrl: null,
        totalVolumeCbm: '1.2000',
        totalWeightKg: '5.0000',
        unitWeightKg: '2.5000',
        unitVolumeCbm: '0.6000',
        skuSpecification: '220V',
      },
    ],
  });

  const makeDemandForAllocation = (
    overrides: Partial<ShippingDemand> = {},
  ): Partial<ShippingDemand> => ({
    id: 500,
    demandCode: 'SD2026042800001',
    salesOrderId: 10,
    sourceDocumentCode: 'SO2026042800001',
    status: ShippingDemandStatus.PENDING_ALLOCATION,
    items: [
      {
        id: 700,
        shippingDemandId: 500,
        salesOrderItemId: 101,
        skuId: 11,
        skuCode: 'SKU001',
        productNameCn: '离心机',
        requiredQuantity: 2,
        fulfillmentType: null,
        stockRequiredQuantity: 0,
        purchaseRequiredQuantity: 0,
        lockedRemainingQuantity: 0,
        shippedQuantity: 0,
        purchaseOrderedQuantity: 0,
        receivedQuantity: 0,
      } as ShippingDemandItem,
    ],
    ...overrides,
  });

  const makeActiveAllocation = (
    overrides: Partial<ShippingDemandInventoryAllocation> = {},
  ): Partial<ShippingDemandInventoryAllocation> => ({
    id: 800,
    shippingDemandId: 500,
    shippingDemandItemId: 700,
    salesOrderItemId: 101,
    skuId: 11,
    warehouseId: 22,
    inventoryBatchId: 901,
    lockSource: 'existing_stock',
    sourceDocumentType: 'shipping_demand',
    sourceDocumentId: 500,
    originalLockedQuantity: 2,
    lockedQuantity: 2,
    shippedQuantity: 0,
    releasedQuantity: 0,
    status: ShippingDemandAllocationStatus.ACTIVE,
    sourceActionKey:
      'shipping-demand:500:confirm-allocation:item:700:batch:901',
    ...overrides,
  });

  const supplier = {
    id: 88,
    name: '信达供应商',
    supplierCode: 'SUP0088',
    contactPerson: 'Lily',
    contactPhone: '13800000000',
    contactEmail: 'lily@example.com',
    paymentTerms: [{ paymentTermName: '月结30天' }],
  };

  const makeQueryBuilder = (result: unknown) => {
    const qb = {
      leftJoinAndSelect: jest.fn(() => qb),
      setLock: jest.fn(() => qb),
      where: jest.fn(() => qb),
      andWhere: jest.fn(() => qb),
      orderBy: jest.fn(() => qb),
      getOne: jest.fn().mockResolvedValue(result),
      getMany: jest.fn().mockResolvedValue(Array.isArray(result) ? result : []),
    };
    return qb;
  };

  const makeRepository = (entity: unknown, state: Record<string, unknown>) => {
    if (entity === SalesOrder) {
      return {
        createQueryBuilder: jest.fn(() => makeQueryBuilder(state.order)),
        update: jest.fn().mockImplementation(async (_id, patch) => {
          state.salesOrderUpdate = patch;
        }),
      };
    }
    if (entity === SalesOrderItem) {
      const updateBuilder = {
        update: jest.fn(() => updateBuilder),
        set: jest.fn((patch) => {
          state.salesOrderItemUpdate = patch;
          return updateBuilder;
        }),
        where: jest.fn((condition, params) => {
          state.salesOrderItemUpdateWhere = { condition, params };
          return updateBuilder;
        }),
        execute: jest.fn().mockResolvedValue(undefined),
      };
      return {
        createQueryBuilder: jest.fn(() => updateBuilder),
      };
    }
    if (entity === ShippingDemand) {
      return {
        createQueryBuilder: jest.fn(() =>
          makeQueryBuilder(
            state.demand ?? state.existingDemand ?? state.latestDemand ?? null,
          ),
        ),
        create: jest.fn((data) => data),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedDemand = { id: 500, ...data };
          return state.savedDemand;
        }),
      };
    }
    if (entity === ShippingDemandItem) {
      return {
        create: jest.fn((data) => data),
        save: jest.fn().mockImplementation(async (data) => {
          if (Array.isArray(data)) {
            state.savedItems = data;
          } else {
            state.savedAllocationItems = [
              ...((state.savedAllocationItems as unknown[]) ?? []),
              { ...data },
            ];
          }
          return data;
        }),
      };
    }
    if (entity === ShippingDemandInventoryAllocation) {
      return {
        createQueryBuilder: jest.fn(() =>
          makeQueryBuilder((state.allocations as unknown[]) ?? []),
        ),
        create: jest.fn((data) => data),
        save: jest.fn().mockImplementation(async (data) => {
          if (Array.isArray(data)) {
            state.savedAllocations = data;
          } else {
            state.savedReleasedAllocations = [
              ...((state.savedReleasedAllocations as unknown[]) ?? []),
              { ...data },
            ];
          }
          return data;
        }),
      };
    }
    if (entity === InventoryTransaction) {
      return {
        create: jest.fn((data) => data),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedInventoryTransactions = data;
          return data;
        }),
      };
    }
    if (entity === Supplier) {
      return {
        findOne: jest.fn().mockImplementation(async ({ where }) => {
          const supplierId = Number(where?.id);
          return (state.suppliersById as Record<number, unknown>)?.[
            supplierId
          ] ?? state.supplier;
        }),
      };
    }
    if (entity === OperationLog) {
      return {
        create: jest.fn((data) => data),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedOperationLog = { id: 900, ...data };
          state.savedOperationLogs = [
            ...((state.savedOperationLogs as unknown[]) ?? []),
            state.savedOperationLog,
          ];
          return state.savedOperationLog;
        }),
      };
    }
    throw new Error('Unexpected repository');
  };

  const makeQueryRunner = (state: Record<string, unknown>) => ({
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager: {
      getRepository: jest.fn((entity) => makeRepository(entity, state)),
    },
  });

  let service: ShippingDemandsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ShippingDemandsService(
      shippingDemandsRepository as any,
      inventoryService as any,
      filesService as any,
    );
  });

  it('finds shipping demand detail with signed urls', async () => {
    shippingDemandsRepository.findById.mockResolvedValue({
      id: 500,
      demandCode: 'SD2026042800001',
      status: ShippingDemandStatus.PENDING_ALLOCATION,
      contractFileKeys: ['contracts/a.pdf'],
      contractFileNames: ['合同A.pdf'],
      plugPhotoKeys: ['plugs/a.png'],
      shippingMarkTemplateKey: 'shipping-mark/a.docx',
      items: [],
    });
    filesService.getSignedUrl.mockImplementation(async (key: string) => {
      return `https://signed.example.com/${key}`;
    });

    const result = await service.findById(500);

    expect(result.contractFileUrls).toEqual([
      'https://signed.example.com/contracts/a.pdf',
    ]);
    expect(result.plugPhotoUrls).toEqual([
      'https://signed.example.com/plugs/a.png',
    ]);
    expect(result.shippingMarkTemplateUrl).toBe(
      'https://signed.example.com/shipping-mark/a.docx',
    );
  });

  it('finds shipping demands with list query', async () => {
    const payload = {
      list: [{ id: 500, demandCode: 'SD2026042800001' }],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    shippingDemandsRepository.findAll.mockResolvedValue(payload);

    const result = await service.findAll({
      keyword: 'SD20260428',
      status: ShippingDemandStatus.PENDING_ALLOCATION,
      salesOrderId: 10,
      sourceDocumentCode: 'SO20260428',
      page: 1,
      pageSize: 20,
    });

    expect(result).toBe(payload);
    expect(shippingDemandsRepository.findAll).toHaveBeenCalledWith({
      keyword: 'SD20260428',
      status: ShippingDemandStatus.PENDING_ALLOCATION,
      salesOrderId: 10,
      sourceDocumentCode: 'SO20260428',
      page: 1,
      pageSize: 20,
    });
  });

  it('updates editable shipping demand fields without touching quantities', async () => {
    shippingDemandsRepository.findById.mockResolvedValue({
      id: 500,
      demandCode: 'SD2026042800001',
      status: ShippingDemandStatus.PREPARED,
      consigneeCompany: 'Old consignee',
      items: [{ id: 700, requiredQuantity: 2, lockedRemainingQuantity: 2 }],
    });
    shippingDemandsRepository.update.mockResolvedValue({
      id: 500,
      demandCode: 'SD2026042800001',
      status: ShippingDemandStatus.PREPARED,
      consigneeCompany: 'New consignee',
      requiredDeliveryAt: '2026-05-20',
      items: [{ id: 700, requiredQuantity: 2, lockedRemainingQuantity: 2 }],
    });

    const result = await service.update(
      500,
      {
        consigneeCompany: 'New consignee',
        requiredDeliveryAt: '2026-05-20',
        exchangeRate: 7.123456,
      },
      'admin',
    );

    expect(result.consigneeCompany).toBe('New consignee');
    expect(shippingDemandsRepository.update).toHaveBeenCalledWith(
      500,
      expect.objectContaining({
        consigneeCompany: 'New consignee',
        requiredDeliveryAt: '2026-05-20',
        exchangeRate: '7.123456',
        updatedBy: 'admin',
      }),
    );
    expect(shippingDemandsRepository.update.mock.calls[0][1]).not.toHaveProperty('items');
    expect(shippingDemandsRepository.update.mock.calls[0][1]).not.toHaveProperty('requiredQuantity');
  });

  it('ignores undefined DTO fields when editing shipping demand', async () => {
    shippingDemandsRepository.findById.mockResolvedValue({
      id: 500,
      demandCode: 'SD2026042800001',
      status: ShippingDemandStatus.PREPARED,
      afterSalesProductSummary: null,
      items: [{ id: 700, requiredQuantity: 2 }],
    });
    shippingDemandsRepository.update.mockResolvedValue({
      id: 500,
      demandCode: 'SD2026042800001',
      status: ShippingDemandStatus.PREPARED,
      afterSalesProductSummary: '售后产品A：1000',
      items: [{ id: 700, requiredQuantity: 2 }],
    });
    const dto = Object.assign(new UpdateShippingDemandDto(), {
      afterSalesProductSummary: '售后产品A：1000',
      status: undefined,
    });

    const result = await service.update(500, dto, 'admin');

    expect(result.afterSalesProductSummary).toBe('售后产品A：1000');
    expect(shippingDemandsRepository.update).toHaveBeenCalledWith(
      500,
      expect.objectContaining({
        afterSalesProductSummary: '售后产品A：1000',
        updatedBy: 'admin',
      }),
    );
    expect(shippingDemandsRepository.update.mock.calls[0][1]).not.toHaveProperty('status');
  });

  it('rejects shipping demand edits that try to change protected fields', async () => {
    shippingDemandsRepository.findById.mockResolvedValue({
      id: 500,
      status: ShippingDemandStatus.PREPARED,
      items: [{ id: 700, requiredQuantity: 2 }],
    });

    await expect(
      service.update(
        500,
        {
          consigneeCompany: 'New consignee',
          items: [{ id: 700, requiredQuantity: 3 }],
        } as any,
        'admin',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(shippingDemandsRepository.update).not.toHaveBeenCalled();
  });

  it('allows readonly status echo without writing it during shipping demand edit', async () => {
    shippingDemandsRepository.findById.mockResolvedValue({
      id: 500,
      demandCode: 'SD2026042800001',
      status: ShippingDemandStatus.PREPARED,
      consigneeCompany: 'Old consignee',
      items: [{ id: 700, requiredQuantity: 2 }],
    });
    shippingDemandsRepository.update.mockResolvedValue({
      id: 500,
      demandCode: 'SD2026042800001',
      status: ShippingDemandStatus.PREPARED,
      consigneeCompany: 'New consignee',
      items: [{ id: 700, requiredQuantity: 2 }],
    });

    const result = await service.update(
      500,
      {
        status: ShippingDemandStatus.PREPARED,
        consigneeCompany: 'New consignee',
      },
      'admin',
    );

    expect(result.consigneeCompany).toBe('New consignee');
    expect(shippingDemandsRepository.update).toHaveBeenCalledWith(
      500,
      expect.objectContaining({
        consigneeCompany: 'New consignee',
        updatedBy: 'admin',
      }),
    );
    expect(shippingDemandsRepository.update.mock.calls[0][1]).not.toHaveProperty('status');
  });

  it('rejects shipping demand edits that try to change status', async () => {
    shippingDemandsRepository.findById.mockResolvedValue({
      id: 500,
      status: ShippingDemandStatus.PREPARED,
      items: [{ id: 700, requiredQuantity: 2 }],
    });

    await expect(
      service.update(
        500,
        {
          status: ShippingDemandStatus.SHIPPED,
          consigneeCompany: 'New consignee',
        },
        'admin',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(shippingDemandsRepository.update).not.toHaveBeenCalled();
  });

  it('rejects editing voided shipping demand', async () => {
    shippingDemandsRepository.findById.mockResolvedValue({
      id: 500,
      status: ShippingDemandStatus.VOIDED,
    });

    await expect(
      service.update(500, { consigneeCompany: 'New consignee' }, 'admin'),
    ).rejects.toThrow('已作废发货需求不允许编辑');
    expect(shippingDemandsRepository.update).not.toHaveBeenCalled();
  });

  it('generates shipping demand from approved sales order', async () => {
    const state: Record<string, unknown> = { order: makeOrder() };
    const queryRunner = makeQueryRunner(state);
    shippingDemandsRepository.createQueryRunner.mockReturnValue(queryRunner);
    shippingDemandsRepository.findById.mockResolvedValue({
      id: 500,
      demandCode: 'SD2026042800001',
      status: ShippingDemandStatus.PENDING_ALLOCATION,
      items: [{ id: 1 }],
    });
    inventoryService.findAvailable.mockResolvedValue([
      {
        skuId: 11,
        warehouseId: 22,
        actualQuantity: 10,
        lockedQuantity: 3,
        availableQuantity: 7,
      },
    ]);

    const result = await service.generateFromSalesOrder(10, 'admin');

    expect(result.demandCode).toBe('SD2026042800001');
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(inventoryService.findAvailable).toHaveBeenCalledWith({
      skuIds: [11],
    });
    expect(state.savedDemand).toEqual(
      expect.objectContaining({
        status: ShippingDemandStatus.PENDING_ALLOCATION,
        salesOrderId: 10,
        sourceDocumentCode: 'SO2026042800001',
        externalOrderCode: 'EXT-001',
        customerContactPerson: '张三',
        bankAccount: 'BOC-001',
        exchangeRate: '7.100000',
        crmSignedAt: '2026-04-27',
        contractFileKeys: ['contracts/a.pdf'],
        contractFileNames: ['合同A.pdf'],
        plugPhotoKeys: ['plugs/a.png'],
        consigneeCompany: 'Consignee Co.',
        notifyCompany: 'Notify Co.',
        shipperCompany: 'Shipper Co.',
        shippingMarkTemplateKey: 'shipping-mark/a.docx',
        productTotalAmount: '600.00',
        expenseTotalAmount: '0.00',
      }),
    );
    expect(state.savedItems).toEqual([
      expect.objectContaining({
        salesOrderItemId: 101,
        requiredQuantity: 2,
        purchaserId: 8,
        purchaserName: '采购员A',
        needsPurchase: YesNo.YES,
        fulfillmentType: null,
        availableStockSnapshot: [
          {
            skuId: 11,
            warehouseId: 22,
            actualQuantity: 10,
            lockedQuantity: 3,
            availableQuantity: 7,
          },
        ],
      }),
    ]);
    expect(state.salesOrderUpdate).toEqual({
      status: SalesOrderStatus.PREPARING,
      updatedBy: 'admin',
    });
    expect(state.savedOperationLog).toEqual(
      expect.objectContaining({
        action: OperationLogAction.UPDATE,
        resourceType: 'sales-orders',
        resourceId: '10',
        changeSummary: [
          {
            field: 'status',
            fieldLabel: '订单状态',
            oldValue: SalesOrderStatus.APPROVED,
            newValue: SalesOrderStatus.PREPARING,
          },
        ],
      }),
    );
  });

  it('confirms allocation and prepares demand when all items use stock', async () => {
    const state: Record<string, unknown> = {
      demand: makeDemandForAllocation(),
    };
    const queryRunner = makeQueryRunner(state);
    shippingDemandsRepository.createQueryRunner.mockReturnValue(queryRunner);
    shippingDemandsRepository.findById.mockResolvedValue({
      id: 500,
      demandCode: 'SD2026042800001',
      status: ShippingDemandStatus.PREPARED,
      items: [{ id: 700, lockedRemainingQuantity: 2 }],
    });
    inventoryService.lockStockInTransaction.mockResolvedValue({
      summary: {
        actualQuantity: 5,
        lockedQuantity: 2,
        availableQuantity: 3,
      },
      batches: [],
      allocations: [{ batchId: 901, quantity: 2 }],
    });

    const result = await service.confirmAllocation(
      500,
      {
        items: [
          {
            itemId: 700,
            fulfillmentType: FulfillmentType.USE_STOCK,
            stockQuantity: 2,
            warehouseId: 22,
          },
        ],
      },
      'admin',
    );

    expect(result.status).toBe(ShippingDemandStatus.PREPARED);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(inventoryService.lockStockInTransaction).toHaveBeenCalledWith(
      queryRunner,
      {
        skuId: 11,
        warehouseId: 22,
        quantity: 2,
        operator: 'admin',
      },
    );
    expect(state.savedAllocationItems).toEqual([
      expect.objectContaining({
        id: 700,
        fulfillmentType: FulfillmentType.USE_STOCK,
        stockRequiredQuantity: 2,
        purchaseRequiredQuantity: 0,
        lockedRemainingQuantity: 2,
      }),
    ]);
    expect(state.savedDemand).toEqual(
      expect.objectContaining({ status: ShippingDemandStatus.PREPARED }),
    );
    expect(state.salesOrderUpdate).toEqual({
      status: SalesOrderStatus.PREPARED,
      updatedBy: 'admin',
    });
    expect(state.savedAllocations).toEqual([
      expect.objectContaining({
        shippingDemandId: 500,
        shippingDemandItemId: 700,
        inventoryBatchId: 901,
        lockedQuantity: 2,
        status: ShippingDemandAllocationStatus.ACTIVE,
      }),
    ]);
    expect(state.savedInventoryTransactions).toEqual([
      expect.objectContaining({
        changeType: InventoryChangeType.LOCK,
        lockedQuantityDelta: 2,
        availableQuantityDelta: -2,
        sourceDocumentType: 'shipping_demand',
        sourceDocumentId: 500,
        sourceDocumentItemId: 700,
      }),
    ]);
    expect(state.savedOperationLog).toEqual(
      expect.objectContaining({
        resourceType: 'shipping-demands',
        resourceId: '500',
      }),
    );
    expect(state.savedOperationLog).toEqual(
      expect.objectContaining({
        requestSummary: expect.objectContaining({
          allocationSummary:
            '共 1 个 SKU；锁定现有库存 2；需采购 0；使用库存 1 行；涉及采购 0 行',
        }),
        changeSummary: expect.arrayContaining([
          expect.objectContaining({
            field: 'allocationSummary',
            newValue:
              '共 1 个 SKU；锁定现有库存 2；需采购 0；使用库存 1 行；涉及采购 0 行',
          }),
          expect.objectContaining({
            field: 'allocationDetails',
            newValue:
              '1. SKU001 / 离心机：使用现有库存，应发 2，锁定库存 2，需采购 0，仓库 22',
          }),
        ]),
      }),
    );
  });

  it('confirms allocation and keeps demand pending purchase order when purchase quantity remains', async () => {
    const state: Record<string, unknown> = {
      demand: makeDemandForAllocation(),
      supplier,
    };
    const queryRunner = makeQueryRunner(state);
    shippingDemandsRepository.createQueryRunner.mockReturnValue(queryRunner);
    shippingDemandsRepository.findById.mockResolvedValue({
      id: 500,
      demandCode: 'SD2026042800001',
      status: ShippingDemandStatus.PENDING_PURCHASE_ORDER,
      items: [{ id: 700, lockedRemainingQuantity: 1 }],
    });
    inventoryService.lockStockInTransaction.mockResolvedValue({
      summary: {
        actualQuantity: 5,
        lockedQuantity: 1,
        availableQuantity: 4,
      },
      batches: [],
      allocations: [{ batchId: 901, quantity: 1 }],
    });

    await service.confirmAllocation(
      500,
      {
        items: [
          {
            itemId: 700,
            fulfillmentType: FulfillmentType.PARTIAL_PURCHASE,
            stockQuantity: 1,
            warehouseId: 22,
            purchaseSupplierId: 88,
          },
        ],
      },
      'admin',
    );

    expect(state.savedAllocationItems).toEqual([
      expect.objectContaining({
        fulfillmentType: FulfillmentType.PARTIAL_PURCHASE,
        stockRequiredQuantity: 1,
        purchaseRequiredQuantity: 1,
        lockedRemainingQuantity: 1,
        purchaseSupplierId: 88,
        purchaseSupplierName: '信达供应商',
        purchaseSupplierCode: 'SUP0088',
        purchaseSupplierContactPerson: 'Lily',
        purchaseSupplierContactPhone: '13800000000',
        purchaseSupplierContactEmail: 'lily@example.com',
        purchaseSupplierPaymentTermName: '月结30天',
      }),
    ]);
    expect(state.savedDemand).toEqual(
      expect.objectContaining({
        status: ShippingDemandStatus.PENDING_PURCHASE_ORDER,
      }),
    );
    expect(state.salesOrderUpdate).toBeUndefined();
  });

  it('rejects allocation purchase line without supplier', async () => {
    const state: Record<string, unknown> = {
      demand: makeDemandForAllocation(),
    };
    const queryRunner = makeQueryRunner(state);
    shippingDemandsRepository.createQueryRunner.mockReturnValue(queryRunner);

    await expect(
      service.confirmAllocation(
        500,
        {
          items: [
            {
              itemId: 700,
              fulfillmentType: FulfillmentType.FULL_PURCHASE,
              stockQuantity: 0,
            },
          ],
        },
        'admin',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(state.savedAllocationItems).toBeUndefined();
  });

  it.each([
    ShippingDemandStatus.PENDING_PURCHASE_ORDER,
    ShippingDemandStatus.PURCHASING,
    ShippingDemandStatus.PREPARED,
    ShippingDemandStatus.PARTIALLY_SHIPPED,
    ShippingDemandStatus.SHIPPED,
    ShippingDemandStatus.VOIDED,
  ])('rejects confirming allocation for non-pending demand %s', async (status) => {
    const state: Record<string, unknown> = {
      demand: makeDemandForAllocation({ status }),
    };
    const queryRunner = makeQueryRunner(state);
    shippingDemandsRepository.createQueryRunner.mockReturnValue(queryRunner);

    await expect(
      service.confirmAllocation(
        500,
        {
          items: [
            {
              itemId: 700,
              fulfillmentType: FulfillmentType.USE_STOCK,
              stockQuantity: 2,
              warehouseId: 22,
            },
          ],
        },
        'admin',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(inventoryService.lockStockInTransaction).not.toHaveBeenCalled();
  });

  it('voids pending demand without allocations and rolls sales order back to approved', async () => {
    const state: Record<string, unknown> = {
      order: { id: 10, status: SalesOrderStatus.PREPARING },
      demand: makeDemandForAllocation(),
      allocations: [],
    };
    const queryRunner = makeQueryRunner(state);
    shippingDemandsRepository.createQueryRunner.mockReturnValue(queryRunner);
    shippingDemandsRepository.findById.mockResolvedValue({
      id: 500,
      demandCode: 'SD2026042800001',
      status: ShippingDemandStatus.VOIDED,
      voidedBy: 'admin',
      items: [{ id: 700, lockedRemainingQuantity: 0 }],
    });

    const result = await service.voidDemand(500, 'admin');

    expect(result.status).toBe(ShippingDemandStatus.VOIDED);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(inventoryService.unlockStockInTransaction).not.toHaveBeenCalled();
    expect(state.savedDemand).toEqual(
      expect.objectContaining({
        status: ShippingDemandStatus.VOIDED,
        voidedBy: 'admin',
      }),
    );
    expect(state.salesOrderUpdate).toEqual({
      status: SalesOrderStatus.APPROVED,
      updatedBy: 'admin',
    });
    expect(state.salesOrderItemUpdate).toEqual({
      purchaseQuantity: 0,
      useStockQuantity: 0,
      preparedQuantity: 0,
      shippedQuantity: 0,
      updatedBy: 'admin',
    });
    expect(state.salesOrderItemUpdateWhere).toEqual({
      condition: 'id IN (:...ids)',
      params: { ids: [101] },
    });
    expect(state.savedOperationLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: OperationLogAction.UPDATE,
          resourceType: 'shipping-demands',
          resourceId: '500',
          resourcePath: '/api/shipping-demands/500/void',
        }),
      ]),
    );
  });

  it('voids pending demand with active allocation by unlocking stock and writing unlock transaction', async () => {
    const state: Record<string, unknown> = {
      order: { id: 10, status: SalesOrderStatus.PREPARING },
      demand: makeDemandForAllocation({
        items: [
          {
            ...(makeDemandForAllocation().items?.[0] as ShippingDemandItem),
            lockedRemainingQuantity: 2,
          },
        ],
      }),
      allocations: [makeActiveAllocation()],
    };
    const queryRunner = makeQueryRunner(state);
    shippingDemandsRepository.createQueryRunner.mockReturnValue(queryRunner);
    shippingDemandsRepository.findById.mockResolvedValue({
      id: 500,
      demandCode: 'SD2026042800001',
      status: ShippingDemandStatus.VOIDED,
      items: [{ id: 700, lockedRemainingQuantity: 0 }],
    });
    inventoryService.unlockStockInTransaction.mockResolvedValue({
      summary: {
        actualQuantity: 5,
        lockedQuantity: 0,
        availableQuantity: 5,
      },
      batches: [],
    });

    await service.voidDemand(500, 'admin');

    expect(inventoryService.unlockStockInTransaction).toHaveBeenCalledWith(
      queryRunner,
      {
        skuId: 11,
        warehouseId: 22,
        allocations: [{ batchId: 901, quantity: 2 }],
        operator: 'admin',
      },
    );
    expect(state.savedReleasedAllocations).toEqual([
      expect.objectContaining({
        id: 800,
        status: ShippingDemandAllocationStatus.RELEASED,
        lockedQuantity: 0,
        releasedQuantity: 2,
      }),
    ]);
    expect(state.savedAllocationItems).toEqual([
      expect.objectContaining({
        id: 700,
        lockedRemainingQuantity: 0,
      }),
    ]);
    expect(state.savedInventoryTransactions).toEqual([
      expect.objectContaining({
        changeType: InventoryChangeType.UNLOCK,
        actualQuantityDelta: 0,
        lockedQuantityDelta: -2,
        availableQuantityDelta: 2,
        beforeLockedQuantity: 2,
        afterLockedQuantity: 0,
        beforeAvailableQuantity: 3,
        afterAvailableQuantity: 5,
        sourceDocumentType: 'shipping_demand',
        sourceDocumentId: 500,
        sourceActionKey: 'shipping-demand:500:void:sku:11:warehouse:22',
      }),
    ]);
  });

  it('rejects voiding non-pending demand without unlocking inventory', async () => {
    const state: Record<string, unknown> = {
      order: { id: 10, status: SalesOrderStatus.PREPARED },
      demand: makeDemandForAllocation({
        status: ShippingDemandStatus.PREPARED,
      }),
      allocations: [makeActiveAllocation()],
    };
    const queryRunner = makeQueryRunner(state);
    shippingDemandsRepository.createQueryRunner.mockReturnValue(queryRunner);

    await expect(service.voidDemand(500, 'admin')).rejects.toThrow(
      BadRequestException,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(inventoryService.unlockStockInTransaction).not.toHaveBeenCalled();
    expect(state.savedDemand).toBeUndefined();
  });

  it('treats already voided demand as idempotent without unlocking again', async () => {
    const state: Record<string, unknown> = {
      order: { id: 10, status: SalesOrderStatus.APPROVED },
      demand: makeDemandForAllocation({
        status: ShippingDemandStatus.VOIDED,
        voidedBy: 'admin',
      }),
      allocations: [makeActiveAllocation()],
    };
    const queryRunner = makeQueryRunner(state);
    shippingDemandsRepository.createQueryRunner.mockReturnValue(queryRunner);
    shippingDemandsRepository.findById.mockResolvedValue({
      id: 500,
      demandCode: 'SD2026042800001',
      status: ShippingDemandStatus.VOIDED,
      items: [{ id: 700, lockedRemainingQuantity: 0 }],
    });

    const result = await service.voidDemand(500, 'admin');

    expect(result.status).toBe(ShippingDemandStatus.VOIDED);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(inventoryService.unlockStockInTransaction).not.toHaveBeenCalled();
    expect(state.savedDemand).toBeUndefined();
    expect(state.savedReleasedAllocations).toBeUndefined();
  });

  it('rolls back when stock is insufficient during allocation confirmation', async () => {
    const state: Record<string, unknown> = {
      demand: makeDemandForAllocation(),
    };
    const queryRunner = makeQueryRunner(state);
    shippingDemandsRepository.createQueryRunner.mockReturnValue(queryRunner);
    inventoryService.lockStockInTransaction.mockRejectedValue(
      new BadRequestException({
        code: 'STOCK_INSUFFICIENT',
        message: '可用库存不足，当前可用 1',
      }),
    );

    await expect(
      service.confirmAllocation(
        500,
        {
          items: [
            {
              itemId: 700,
              fulfillmentType: FulfillmentType.USE_STOCK,
              stockQuantity: 2,
              warehouseId: 22,
            },
          ],
        },
        'admin',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(state.savedAllocations).toBeUndefined();
    expect(state.savedInventoryTransactions).toBeUndefined();
    expect(state.savedDemand).toBeUndefined();
  });

  it('retries demand code duplicate key conflicts', async () => {
    const firstState: Record<string, unknown> = { order: makeOrder() };
    const secondState: Record<string, unknown> = { order: makeOrder() };
    const firstQueryRunner = makeQueryRunner(firstState);
    const secondQueryRunner = makeQueryRunner(secondState);
    shippingDemandsRepository.createQueryRunner
      .mockReturnValueOnce(firstQueryRunner)
      .mockReturnValueOnce(secondQueryRunner);
    shippingDemandsRepository.findById.mockResolvedValue({
      id: 500,
      demandCode: 'SD2026042800002',
      status: ShippingDemandStatus.PENDING_ALLOCATION,
      items: [{ id: 1 }],
    });
    inventoryService.findAvailable.mockResolvedValue([]);

    firstQueryRunner.manager.getRepository = jest.fn((entity) => {
      const repo = makeRepository(entity, firstState);
      if (entity === ShippingDemand) {
        return {
          ...repo,
          save: jest.fn().mockRejectedValue({ code: 'ER_DUP_ENTRY' }),
        };
      }
      return repo;
    });

    const result = await service.generateFromSalesOrder(10, 'admin');

    expect(result.demandCode).toBe('SD2026042800002');
    expect(firstQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(secondQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(shippingDemandsRepository.createQueryRunner).toHaveBeenCalledTimes(
      2,
    );
  });

  it('rejects non-approved sales order', async () => {
    const state: Record<string, unknown> = {
      order: makeOrder(SalesOrderStatus.IN_REVIEW),
    };
    const queryRunner = makeQueryRunner(state);
    shippingDemandsRepository.createQueryRunner.mockReturnValue(queryRunner);

    await expect(service.generateFromSalesOrder(10, 'admin')).rejects.toThrow(
      BadRequestException,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
  });

  it('rejects duplicate active shipping demand', async () => {
    const state: Record<string, unknown> = {
      order: makeOrder(),
      existingDemand: {
        id: 88,
        status: ShippingDemandStatus.PENDING_ALLOCATION,
      },
    };
    const queryRunner = makeQueryRunner(state);
    shippingDemandsRepository.createQueryRunner.mockReturnValue(queryRunner);

    await expect(service.generateFromSalesOrder(10, 'admin')).rejects.toThrow(
      BadRequestException,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(inventoryService.findAvailable).not.toHaveBeenCalled();
  });
});
