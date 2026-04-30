import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  ContractTemplateStatus,
  FulfillmentType,
  PurchaseOrderApplicationType,
  PurchaseOrderDemandType,
  PurchaseOrderReceiptStatus,
  PurchaseOrderSettlementDateType,
  PurchaseOrderSettlementType,
  PurchaseOrderStatus,
  PurchaseOrderType,
  SalesOrderType,
  ShippingDemandStatus,
  YesNo,
} from '@infitek/shared';
import { OperationLog } from '../../operation-logs/entities/operation-log.entity';
import { Company } from '../../master-data/companies/entities/company.entity';
import { ContractTemplate } from '../../master-data/contract-templates/entities/contract-template.entity';
import { Currency } from '../../master-data/currencies/entities/currency.entity';
import { Sku } from '../../master-data/skus/entities/sku.entity';
import { Supplier } from '../../master-data/suppliers/entities/supplier.entity';
import { ShippingDemandItem } from '../../shipping-demands/entities/shipping-demand-item.entity';
import { ShippingDemand } from '../../shipping-demands/entities/shipping-demand.entity';
import { User } from '../../users/entities/user.entity';
import { PurchaseOrderItem } from '../entities/purchase-order-item.entity';
import { PurchaseOrder } from '../entities/purchase-order.entity';
import { PurchaseOrdersService } from '../purchase-orders.service';

describe('PurchaseOrdersService', () => {
  const purchaseOrdersRepository = {
    createQueryRunner: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    findBySourceActionKeyPrefix: jest.fn(),
  };

  const makeDemand = (
    overrides: Partial<ShippingDemand> = {},
  ): Partial<ShippingDemand> => ({
    id: 500,
    demandCode: 'SD2026042900001',
    salesOrderId: 10,
    sourceDocumentCode: 'SO2026042900001',
    orderType: SalesOrderType.SALES,
    currencyId: 3,
    currencyCode: 'USD',
    currencyName: '美元',
    currencySymbol: '$',
    signingCompanyId: 2,
    signingCompanyName: '信达主体',
    salespersonName: 'Mia',
    plugPhotoKeys: ['plug-a.jpg'],
    status: ShippingDemandStatus.PENDING_PURCHASE_ORDER,
    items: [
      {
        id: 700,
        shippingDemandId: 500,
        salesOrderItemId: 101,
        skuId: 11,
        skuCode: 'SKU001',
        productNameCn: '离心机',
        productNameEn: 'Centrifuge',
        skuSpecification: '220V',
        unitPrice: '12.50',
        unitId: 6,
        unitName: '台',
        lineType: 'main',
        spuId: 300,
        spuName: 'SPU001',
        electricalParams: '220V',
        hasPlug: YesNo.YES,
        fulfillmentType: FulfillmentType.FULL_PURCHASE,
        purchaseRequiredQuantity: 5,
        purchaseOrderedQuantity: 1,
        purchaseSupplierId: 88,
        purchaseSupplierName: '信达供应商',
        purchaseSupplierCode: 'SUP0088',
        purchaseSupplierContactPerson: 'Lily',
        purchaseSupplierContactPhone: '13800000000',
        purchaseSupplierContactEmail: 'lily@example.com',
        purchaseSupplierPaymentTermName: '月结30天',
      },
      {
        id: 701,
        shippingDemandId: 500,
        salesOrderItemId: 102,
        skuId: 12,
        skuCode: 'SKU002',
        productNameCn: '试管',
        productNameEn: 'Tube',
        skuSpecification: '10ml',
        unitId: 7,
        unitName: '盒',
        fulfillmentType: FulfillmentType.USE_STOCK,
        purchaseRequiredQuantity: 0,
        purchaseOrderedQuantity: 0,
      },
    ] as any,
    ...overrides,
  });

  const supplier = {
    id: 88,
    name: '信达供应商',
    supplierCode: 'SUP0088',
    contactPerson: 'Lily',
    contactPhone: '13800000000',
    contactEmail: 'lily@example.com',
    address: '深圳市南山区',
    paymentTerms: [{ paymentTermName: '月结30天' }],
  };

  const contract = {
    id: 99,
    name: '标准采购合同',
    status: ContractTemplateStatus.APPROVED,
  };

  const sku = {
    id: 11,
    skuCode: 'SKU001',
    nameCn: '离心机',
    nameEn: 'Centrifuge',
    specification: '220V',
    unitId: 6,
    productType: '主品',
    productModel: 'X-100',
    spuId: 300,
    electricalParams: '220V',
    coreParams: '8000rpm',
    hasPlug: true,
    specialAttributesNote: '带欧规插头',
  };

  const company = {
    id: 2,
    nameCn: '信达主体',
    addressCn: '深圳市南山区科技园',
    signingLocation: '深圳',
    contactPerson: '陈经理',
    contactPhone: '0755-00000000',
  };

  const currency = {
    id: 3,
    code: 'USD',
    name: '美元',
    symbol: '$',
  };

  const user = {
    id: 4,
    name: '采购员小赵',
  };

  const makeDemandQueryBuilder = (state: Record<string, any>) => {
    const qb = {
      leftJoinAndSelect: jest.fn(() => qb),
      where: jest.fn(() => qb),
      orderBy: jest.fn(() => qb),
      setLock: jest.fn(() => qb),
      getOne: jest.fn().mockResolvedValue(state.demand),
    };
    return qb;
  };

  const makePurchaseOrderQueryBuilder = (state: Record<string, any>) => {
    let latestCodeQuery = false;
    const qb = {
      setLock: jest.fn(() => qb),
      where: jest.fn(() => qb),
      orderBy: jest.fn(() => {
        latestCodeQuery = true;
        return qb;
      }),
      getOne: jest.fn().mockImplementation(async () => {
        if (!latestCodeQuery) {
          return state.order ?? null;
        }
        const orders = [...(state.savedOrders ?? [])].sort((a, b) =>
          String(b.poCode).localeCompare(String(a.poCode)),
        );
        return orders[0] ?? state.latestOrder ?? null;
      }),
    };
    return qb;
  };

  const makePurchaseSumQueryBuilder = (state: Record<string, any>) => {
    const qb = {
      innerJoin: jest.fn(() => qb),
      select: jest.fn(() => qb),
      addSelect: jest.fn(() => qb),
      where: jest.fn(() => qb),
      andWhere: jest.fn(() => qb),
      groupBy: jest.fn(() => qb),
      getRawMany: jest.fn().mockImplementation(async () => {
        const totals = new Map<number, number>();
        for (const row of state.purchaseRowsBefore ?? []) {
          totals.set(
            Number(row.shippingDemandItemId),
            (totals.get(Number(row.shippingDemandItemId)) ?? 0) +
              Number(row.quantity ?? 0),
          );
        }
        for (const item of state.savedItems ?? []) {
          if (!item.shippingDemandItemId) continue;
          totals.set(
            Number(item.shippingDemandItemId),
            (totals.get(Number(item.shippingDemandItemId)) ?? 0) +
              Number(item.quantity ?? 0),
          );
        }
        return [...totals.entries()].map(
          ([shippingDemandItemId, quantity]) => ({
            shippingDemandItemId: String(shippingDemandItemId),
            quantity: String(quantity),
          }),
        );
      }),
    };
    return qb;
  };

  const makeRepository = (entity: unknown, state: Record<string, any>) => {
    if (entity === ShippingDemand) {
      return {
        createQueryBuilder: jest.fn(() => makeDemandQueryBuilder(state)),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedDemand = data;
          return data;
        }),
      };
    }
    if (entity === ShippingDemandItem) {
      return {
        find: jest.fn().mockResolvedValue(state.demand.items),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedDemandItems = data;
          return data;
        }),
      };
    }
    if (entity === PurchaseOrder) {
      return {
        createQueryBuilder: jest.fn(() => makePurchaseOrderQueryBuilder(state)),
        find: jest.fn().mockResolvedValue(state.existingOrders ?? []),
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn((data) => data),
        save: jest.fn().mockImplementation(async (data) => {
          if (Array.isArray(data)) return data;
          state.orderSaveSeq = (state.orderSaveSeq ?? 0) + 1;
          const saved = { id: 900 + state.orderSaveSeq, ...data };
          state.savedOrders = [...(state.savedOrders ?? []), saved];
          state.order = saved;
          return saved;
        }),
      };
    }
    if (entity === PurchaseOrderItem) {
      return {
        createQueryBuilder: jest.fn(() => makePurchaseSumQueryBuilder(state)),
        create: jest.fn((data) => data),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedItems = [...(state.savedItems ?? []), ...data];
          return data;
        }),
      };
    }
    if (entity === Supplier) {
      return {
        findOne: jest.fn().mockImplementation(async ({ where }) => {
          const supplierId = Number(where?.id);
          return state.suppliersById?.[supplierId] ?? state.supplier;
        }),
      };
    }
    if (entity === Company) {
      return {
        findOne: jest.fn().mockImplementation(async ({ where }) => {
          const companyId = Number(where?.id);
          return state.companiesById?.[companyId] ?? state.company ?? null;
        }),
      };
    }
    if (entity === Currency) {
      return {
        findOne: jest.fn().mockImplementation(async ({ where }) => {
          const currencyId = Number(where?.id);
          return state.currenciesById?.[currencyId] ?? state.currency ?? null;
        }),
      };
    }
    if (entity === User) {
      return {
        findOne: jest.fn().mockImplementation(async ({ where }) => {
          const userId = Number(where?.id);
          return state.usersById?.[userId] ?? state.user ?? null;
        }),
      };
    }
    if (entity === ContractTemplate) {
      return { findOne: jest.fn().mockResolvedValue(state.contract) };
    }
    if (entity === Sku) {
      return { findOne: jest.fn().mockResolvedValue(state.sku) };
    }
    if (entity === OperationLog) {
      return {
        create: jest.fn((data) => data),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedOperationLogs = [
            ...(state.savedOperationLogs ?? []),
            ...(Array.isArray(data) ? data : [data]),
          ];
          return data;
        }),
      };
    }
    throw new Error('Unexpected repository');
  };

  const makeQueryRunner = (state: Record<string, any>) => ({
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager: {
      getRepository: jest.fn((entity) => makeRepository(entity, state)),
    },
  });

  let service: PurchaseOrdersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PurchaseOrdersService(purchaseOrdersRepository as any);
    purchaseOrdersRepository.findBySourceActionKeyPrefix.mockResolvedValue([]);
  });

  it('delegates list query to repository', async () => {
    const query = {
      status: PurchaseOrderStatus.PENDING_CONFIRM,
      supplierId: 88,
      page: 1,
      pageSize: 20,
    };
    const pageResult = {
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
    purchaseOrdersRepository.findAll.mockResolvedValue(pageResult);

    await expect(service.findAll(query as any)).resolves.toBe(pageResult);
    expect(purchaseOrdersRepository.findAll).toHaveBeenCalledWith(query);
  });

  it('returns purchase order detail with repository ordered items', async () => {
    const order = {
      id: 901,
      poCode: 'XCPO202604300001',
      items: [{ id: 1 }, { id: 2 }],
    };
    purchaseOrdersRepository.findById.mockResolvedValue(order);

    await expect(service.findById(901)).resolves.toBe(order);
    expect(purchaseOrdersRepository.findById).toHaveBeenCalledWith(901);
  });

  it('throws when purchase order detail does not exist', async () => {
    purchaseOrdersRepository.findById.mockResolvedValue(null);

    await expect(service.findById(999)).rejects.toThrow(NotFoundException);
  });

  it('builds requisition purchase prefill from demand purchase gap', async () => {
    const state: Record<string, any> = { demand: makeDemand() };
    const queryRunner = makeQueryRunner(state);
    purchaseOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);

    const result = await service.getCreatePrefill(500);

    expect(result.items).toEqual([
      expect.objectContaining({
        shippingDemandItemId: 700,
        purchaseRequiredQuantity: 5,
        purchaseOrderedQuantity: 1,
        availableToOrder: 4,
        quantity: 4,
        purchaseSupplierId: 88,
        purchaseSupplierName: '信达供应商',
        purchaseSupplierCode: 'SUP0088',
      }),
    ]);
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('creates requisition purchase order and advances demand to purchasing', async () => {
    const state: Record<string, any> = {
      demand: makeDemand(),
      supplier,
      contract,
      company,
      purchaseRowsBefore: [{ shippingDemandItemId: '700', quantity: '1' }],
    };
    const queryRunner = makeQueryRunner(state);
    purchaseOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);
    purchaseOrdersRepository.findById.mockImplementation(
      async (id: number) => ({
        ...state.savedOrders.find((order: any) => Number(order.id) === id),
        items: state.savedItems,
      }),
    );

    const result = await service.createFromShippingDemand(
      {
        shippingDemandId: 500,
        requestKey: 'req-001',
        groups: [
          {
            supplierId: 88,
            items: [
              {
                shippingDemandItemId: 700,
                quantity: 4,
                unitPrice: 12.5,
              },
            ],
          },
        ],
      },
      'admin',
    );

    expect(result).toHaveLength(1);
    expect(state.savedOrders[0]).toEqual(
      expect.objectContaining({
        supplierId: 88,
        orderType: PurchaseOrderType.REQUISITION,
        status: PurchaseOrderStatus.PENDING_CONFIRM,
        shippingDemandId: 500,
        totalAmount: '50.00',
        totalQuantity: 4,
        supplierCode: 'SUP0088',
        supplierNameText: '信达供应商',
        supplierPaymentTermName: '月结30天',
        plugPhotoKeys: ['plug-a.jpg'],
        purchaseCompanyId: 2,
        purchaseCompanyName: '信达主体',
        companyAddressCn: '深圳市南山区科技园',
        applicationType: PurchaseOrderApplicationType.SALES_REQUISITION,
        demandType: PurchaseOrderDemandType.SALES_ORDER,
        currencyCode: 'USD',
        settlementDateType: PurchaseOrderSettlementDateType.ORDER_DATE,
        purchaserId: null,
        salespersonName: 'Mia',
        paidAmount: '0.00',
        receivedTotalQuantity: 0,
        receiptStatus: PurchaseOrderReceiptStatus.NOT_RECEIVED,
        isFullyPaid: YesNo.NO,
        sourceActionKey: 'req-001:supplier:88',
      }),
    );
    expect(state.savedItems[0]).toEqual(
      expect.objectContaining({
        shippingDemandItemId: 700,
        quantity: 4,
        unitPrice: '12.50',
        amount: '50.00',
        listPrice: '12.50',
        isInvoiced: YesNo.NO,
        isFullyReceived: YesNo.NO,
        hasPlugText: '是',
      }),
    );
    expect(state.savedDemand.status).toBe(ShippingDemandStatus.PURCHASING);
    expect(state.savedDemandItems[0].purchaseOrderedQuantity).toBe(5);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
  });

  it('creates requisition purchase orders grouped by supplier', async () => {
    const demand = makeDemand();
    const purchaseItem = (demand.items as any[])[0];
    const state: Record<string, any> = {
      demand: makeDemand({
        items: [
          purchaseItem,
          {
            ...purchaseItem,
            id: 702,
            salesOrderItemId: 103,
            skuId: 13,
            skuCode: 'SKU003',
            productNameCn: '移液器',
            productNameEn: 'Pipette',
            skuSpecification: '1ml',
            purchaseRequiredQuantity: 2,
            purchaseOrderedQuantity: 0,
            purchaseSupplierId: 89,
            purchaseSupplierName: '远达供应商',
            purchaseSupplierCode: 'SUP0089',
          },
        ] as any,
      }),
      suppliersById: {
        88: supplier,
        89: {
          ...supplier,
          id: 89,
          name: '远达供应商',
          supplierCode: 'SUP0089',
          contactPerson: 'Chen',
        },
      },
      contract,
      company,
      purchaseRowsBefore: [{ shippingDemandItemId: '700', quantity: '1' }],
    };
    const queryRunner = makeQueryRunner(state);
    purchaseOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);
    purchaseOrdersRepository.findById.mockImplementation(
      async (id: number) => ({
        ...state.savedOrders.find((order: any) => Number(order.id) === id),
        items: state.savedItems.filter(
          (item: any) => Number(item.purchaseOrderId) === Number(id),
        ),
      }),
    );

    const result = await service.createFromShippingDemand(
      {
        shippingDemandId: 500,
        requestKey: 'req-grouped',
        groups: [
          {
            supplierId: 88,
            items: [
              {
                shippingDemandItemId: 700,
                quantity: 4,
                unitPrice: 12.5,
              },
            ],
          },
          {
            supplierId: 89,
            items: [
              {
                shippingDemandItemId: 702,
                quantity: 2,
                unitPrice: 10,
              },
            ],
          },
        ],
      },
      'admin',
    );

    expect(result).toHaveLength(2);
    expect(state.savedOrders).toEqual([
      expect.objectContaining({
        supplierId: 88,
        poCode: expect.stringMatching(/^XCPO\d{8}0001$/),
        sourceActionKey: 'req-grouped:supplier:88',
      }),
      expect.objectContaining({
        supplierId: 89,
        poCode: expect.stringMatching(/^XCPO\d{8}0002$/),
        sourceActionKey: 'req-grouped:supplier:89',
      }),
    ]);
    expect(state.savedDemandItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 700, purchaseOrderedQuantity: 5 }),
        expect.objectContaining({ id: 702, purchaseOrderedQuantity: 2 }),
      ]),
    );
  });

  it('returns existing requisition orders for duplicate request key', async () => {
    const existingOrder = {
      id: 901,
      poCode: 'PO2026042900001',
      sourceActionKey: 'req-001:supplier:88',
      orderType: PurchaseOrderType.REQUISITION,
      status: PurchaseOrderStatus.PENDING_CONFIRM,
      items: [],
    };
    purchaseOrdersRepository.findBySourceActionKeyPrefix.mockResolvedValue([
      existingOrder,
    ]);

    const result = await service.createFromShippingDemand({
      shippingDemandId: 500,
      requestKey: 'req-001',
      groups: [
        {
          supplierId: 88,
          items: [
            {
              shippingDemandItemId: 700,
              quantity: 4,
              unitPrice: 12.5,
            },
          ],
        },
      ],
    });

    expect(result).toEqual([existingOrder]);
    expect(purchaseOrdersRepository.createQueryRunner).not.toHaveBeenCalled();
  });

  it('checks transaction idempotency before demand gap validation', async () => {
    const existingOrder = {
      id: 901,
      poCode: 'PO2026042900001',
      sourceActionKey: 'req-race:supplier:88',
      orderType: PurchaseOrderType.REQUISITION,
      status: PurchaseOrderStatus.PENDING_CONFIRM,
      items: [],
    };
    const state: Record<string, any> = {
      existingOrders: [existingOrder],
    };
    const queryRunner = makeQueryRunner(state);
    purchaseOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);
    purchaseOrdersRepository.findById.mockResolvedValue(existingOrder);

    const result = await service.createFromShippingDemand({
      shippingDemandId: 500,
      requestKey: 'req-race',
      groups: [
        {
          supplierId: 88,
          items: [
            {
              shippingDemandItemId: 700,
              quantity: 4,
              unitPrice: 12.5,
            },
          ],
        },
      ],
    });

    expect(result).toEqual([existingOrder]);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
  });

  it('rejects requisition quantity above purchase gap', async () => {
    const state: Record<string, any> = {
      demand: makeDemand(),
      supplier,
      contract,
      purchaseRowsBefore: [{ shippingDemandItemId: '700', quantity: '1' }],
    };
    const queryRunner = makeQueryRunner(state);
    purchaseOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);

    await expect(
      service.createFromShippingDemand({
        shippingDemandId: 500,
        requestKey: 'req-002',
        groups: [
          {
            supplierId: 88,
            items: [
              {
                shippingDemandItemId: 700,
                quantity: 5,
                unitPrice: 12.5,
              },
            ],
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(state.savedOrders).toBeUndefined();
  });

  it('rejects requisition item when group supplier differs from demand line supplier', async () => {
    const state: Record<string, any> = {
      demand: makeDemand(),
      suppliersById: {
        89: {
          ...supplier,
          id: 89,
          name: '远达供应商',
          supplierCode: 'SUP0089',
        },
      },
      contract,
    };
    const queryRunner = makeQueryRunner(state);
    purchaseOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);

    await expect(
      service.createFromShippingDemand({
        shippingDemandId: 500,
        requestKey: 'req-mismatch',
        groups: [
          {
            supplierId: 89,
            items: [
              {
                shippingDemandItemId: 700,
                quantity: 4,
                unitPrice: 12.5,
              },
            ],
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(state.savedOrders).toBeUndefined();
  });

  it('rejects requisition item when demand line has no supplier', async () => {
    const demand = makeDemand();
    const purchaseItem = (demand.items as any[])[0];
    const state: Record<string, any> = {
      demand: makeDemand({
        items: [
          {
            ...purchaseItem,
            purchaseSupplierId: null,
            purchaseSupplierName: null,
            purchaseSupplierCode: null,
          },
        ] as any,
      }),
      supplier,
      contract,
    };
    const queryRunner = makeQueryRunner(state);
    purchaseOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);

    await expect(
      service.createFromShippingDemand({
        shippingDemandId: 500,
        requestKey: 'req-no-supplier',
        groups: [
          {
            supplierId: 88,
            items: [
              {
                shippingDemandItemId: 700,
                quantity: 4,
                unitPrice: 12.5,
              },
            ],
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(state.savedOrders).toBeUndefined();
  });

  it('creates stock purchase order without touching shipping demand', async () => {
    const state: Record<string, any> = {
      demand: makeDemand(),
      supplier,
      contract,
      sku,
      company,
      currency,
      user,
    };
    const queryRunner = makeQueryRunner(state);
    purchaseOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);
    purchaseOrdersRepository.findById.mockImplementation(
      async (id: number) => ({
        ...state.savedOrders.find((order: any) => Number(order.id) === id),
        items: state.savedItems,
      }),
    );

    const result = await service.create(
      {
        supplierId: 88,
        purchaseCompanyId: 2,
        currencyId: 3,
        purchaserId: 4,
        purchaseDate: '2026-04-30',
        poDeliveryDate: '2026-05-15',
        arrivalDate: '2026-05-20',
        isPrepaid: YesNo.YES,
        prepaidRatio: 30,
        applicationType: PurchaseOrderApplicationType.STOCK_PURCHASE,
        demandType: PurchaseOrderDemandType.SALES_ORDER,
        settlementDateType: PurchaseOrderSettlementDateType.RECEIPT_DATE,
        settlementType: PurchaseOrderSettlementType.MONTHLY,
        items: [{ skuId: 11, quantity: 3, unitPrice: 9 }],
      },
      'admin',
    );

    expect(result.orderType).toBe(PurchaseOrderType.STOCK);
    expect(state.savedOrders[0]).toEqual(
      expect.objectContaining({
        shippingDemandId: null,
        status: PurchaseOrderStatus.PENDING_CONFIRM,
        purchaseCompanyName: '信达主体',
        currencyCode: 'USD',
        purchaserName: '采购员小赵',
        poDeliveryDate: '2026-05-15',
        arrivalDate: '2026-05-20',
        isPrepaid: YesNo.YES,
        prepaidRatio: 30,
        settlementType: PurchaseOrderSettlementType.MONTHLY,
        totalQuantity: 3,
        totalAmount: '27.00',
      }),
    );
    expect(state.savedItems[0]).toEqual(
      expect.objectContaining({
        hasPlugText: '是',
        coreParams: '8000rpm',
        specialAttributeNote: '带欧规插头',
      }),
    );
    expect(state.savedDemand).toBeUndefined();
  });

  it('transitions purchase order through internal and supplier confirmations', async () => {
    const state: Record<string, any> = {
      order: {
        id: 901,
        poCode: 'PO2026042900001',
        status: PurchaseOrderStatus.PENDING_CONFIRM,
      },
    };
    const queryRunner = makeQueryRunner(state);
    purchaseOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);
    purchaseOrdersRepository.findById.mockImplementation(
      async () => state.order,
    );

    const internal = await service.confirmInternal(901, 'admin');
    expect(internal.status).toBe(PurchaseOrderStatus.SUPPLIER_CONFIRMING);

    state.order.status = PurchaseOrderStatus.SUPPLIER_CONFIRMING;
    const supplierConfirmed = await service.confirmSupplier(901, 'admin');
    expect(supplierConfirmed.status).toBe(PurchaseOrderStatus.PENDING_RECEIPT);
    expect(state.savedOperationLogs).toHaveLength(2);
  });
});
