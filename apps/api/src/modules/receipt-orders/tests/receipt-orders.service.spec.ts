import { BadRequestException } from '@nestjs/common';
import {
  InventoryChangeType,
  InventoryBatchSourceType,
  PurchaseOrderReceiptStatus,
  PurchaseOrderStatus,
  PurchaseOrderType,
  ReceiptOrderStatus,
  ReceiptOrderType,
  SalesOrderStatus,
  ShippingDemandAllocationStatus,
  ShippingDemandStatus,
  YesNo,
} from '@infitek/shared';
import {
  OperationLog,
  OperationLogAction,
} from '../../operation-logs/entities/operation-log.entity';
import { Company } from '../../master-data/companies/entities/company.entity';
import { Warehouse } from '../../master-data/warehouses/entities/warehouse.entity';
import { PurchaseOrderItem } from '../../purchase-orders/entities/purchase-order-item.entity';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { SalesOrderItem } from '../../sales-orders/entities/sales-order-item.entity';
import { SalesOrder } from '../../sales-orders/entities/sales-order.entity';
import { ShippingDemandInventoryAllocation } from '../../shipping-demands/entities/shipping-demand-inventory-allocation.entity';
import { ShippingDemandItem } from '../../shipping-demands/entities/shipping-demand-item.entity';
import { ShippingDemand } from '../../shipping-demands/entities/shipping-demand.entity';
import { InventoryTransaction } from '../../inventory/entities/inventory-transaction.entity';
import { User } from '../../users/entities/user.entity';
import { ReceiptOrderItem } from '../entities/receipt-order-item.entity';
import { ReceiptOrder } from '../entities/receipt-order.entity';
import { ReceiptOrdersService } from '../receipt-orders.service';

describe('ReceiptOrdersService', () => {
  const receiptOrdersRepository = {
    createQueryRunner: jest.fn(),
    findById: jest.fn(),
    findBySourceActionKey: jest.fn(),
    findPurchaseOrderOptions: jest.fn(),
  };

  const inventoryService = {
    increaseStockInTransaction: jest.fn(),
    lockStockInTransaction: jest.fn(),
  };

  const syncShippingDemandItems = (state: Record<string, any>, data: any) => {
    const items = Array.isArray(data) ? data : [data];
    state.shippingDemandItems = items.map((item: any) => ({ ...item }));
    const demandById = new Map(
      (state.shippingDemands ?? []).map((demand: any) => [Number(demand.id), demand]),
    );
    for (const item of state.shippingDemandItems) {
      const demand = demandById.get(Number(item.shippingDemandId));
      if (!demand) continue;
      const existingItems = demand.items ?? [];
      const nextItems = existingItems.filter(
        (current: any) => Number(current.id) !== Number(item.id),
      );
      nextItems.push(item);
      nextItems.sort((a: any, b: any) => Number(a.id) - Number(b.id));
      demand.items = nextItems;
    }
  };

  const syncSalesOrderItems = (state: Record<string, any>, data: any) => {
    const items = Array.isArray(data) ? data : [data];
    state.salesOrderItems = items.map((item: any) => ({ ...item }));
  };

  const makeShippingDemand = (
    overrides: Partial<ShippingDemand> = {},
  ): Partial<ShippingDemand> => ({
    id: 700,
    demandCode: 'XCFH202604300001',
    salesOrderId: 1100,
    status: ShippingDemandStatus.PURCHASING,
    items: [
      {
        id: 701,
        shippingDemandId: 700,
        salesOrderItemId: 1201,
        skuId: 11,
        skuCode: 'SKU001',
        requiredQuantity: 5,
        lockedRemainingQuantity: 1,
        shippedQuantity: 0,
        purchaseRequiredQuantity: 5,
        stockRequiredQuantity: 0,
        purchaseOrderedQuantity: 5,
        receivedQuantity: 1,
      },
    ] as any,
    ...overrides,
  });

  const makeSalesOrder = (
    overrides: Partial<SalesOrder> = {},
  ): Partial<SalesOrder> => ({
    id: 1100,
    status: SalesOrderStatus.PREPARING,
    ...overrides,
  });

  const makeSalesOrderItem = (
    overrides: Partial<SalesOrderItem> = {},
  ): Partial<SalesOrderItem> => ({
    id: 1201,
    purchaseQuantity: 5,
    useStockQuantity: 0,
    preparedQuantity: 1,
    shippedQuantity: 0,
    ...overrides,
  });

  const makePurchaseOrder = (
    overrides: Partial<PurchaseOrder> = {},
  ): Partial<PurchaseOrder> => ({
    id: 500,
    poCode: 'XCPO202604300001',
    status: PurchaseOrderStatus.PENDING_RECEIPT,
    receiptStatus: PurchaseOrderReceiptStatus.NOT_RECEIVED,
    supplierId: 88,
    supplierName: '信达供应商',
    purchaseCompanyId: 2,
    purchaseCompanyName: '信达主体',
    shippingDemandId: 700,
    shippingDemandCode: 'XCFH202604300001',
    orderType: PurchaseOrderType.REQUISITION,
    totalQuantity: 5,
    receivedTotalQuantity: 1,
    items: [
      {
        id: 900,
        purchaseOrderId: 500,
        shippingDemandItemId: 701,
        skuId: 11,
        skuCode: 'SKU001',
        productNameCn: '离心机',
        productType: '设备类',
        spuName: 'SPU001',
        quantity: 5,
        receivedQuantity: 1,
        unitPrice: '12.50',
        isFullyReceived: YesNo.NO,
      },
    ] as any,
    receiptOrders: [],
    ...overrides,
  });

  const makePurchaseOrderQueryBuilder = (state: Record<string, any>) => {
    const qb = {
      leftJoinAndSelect: jest.fn(() => qb),
      where: jest.fn(() => qb),
      orderBy: jest.fn(() => qb),
      addOrderBy: jest.fn(() => qb),
      setLock: jest.fn(() => qb),
      getOne: jest.fn().mockResolvedValue(state.purchaseOrder),
    };
    return qb;
  };

  const makeReceiptCodeQueryBuilder = (state: Record<string, any>) => {
    const qb = {
      setLock: jest.fn(() => qb),
      where: jest.fn(() => qb),
      orderBy: jest.fn(() => qb),
      getOne: jest.fn().mockResolvedValue(state.latestReceiptOrder ?? null),
    };
    return qb;
  };

  const makeShippingDemandQueryBuilder = (state: Record<string, any>) => {
    const qb = {
      leftJoinAndSelect: jest.fn(() => qb),
      setLock: jest.fn(() => qb),
      where: jest.fn(() => qb),
      orderBy: jest.fn(() => qb),
      addOrderBy: jest.fn(() => qb),
      getMany: jest.fn().mockImplementation(async () =>
        (state.shippingDemands ?? []).map((demand: any) => ({
          ...demand,
          items: [...(demand.items ?? [])],
        })),
      ),
    };
    return qb;
  };

  const makeSalesOrderQueryBuilder = (state: Record<string, any>) => {
    const qb = {
      setLock: jest.fn(() => qb),
      where: jest.fn(() => qb),
      getMany: jest.fn().mockImplementation(async () =>
        (state.salesOrders ?? []).map((order: any) => ({ ...order })),
      ),
    };
    return qb;
  };

  const makeRepository = (entity: unknown, state: Record<string, any>) => {
    if (entity === PurchaseOrder) {
      return {
        createQueryBuilder: jest.fn(() => {
          if (state.purchaseOrderQueryMode === 'find') {
            return makePurchaseOrderQueryBuilder(state);
          }
          return makeReceiptCodeQueryBuilder(state);
        }),
        create: jest.fn((data) => data),
        update: jest.fn().mockImplementation(async (id, patch) => {
          state.updatedPurchaseOrder = { id, ...patch };
          return { affected: 1 };
        }),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedPurchaseOrder = { ...data };
          return state.savedPurchaseOrder;
        }),
      };
    }
    if (entity === PurchaseOrderItem) {
      return {
        createQueryBuilder: jest.fn(() => {
          const qb = {
            innerJoin: jest.fn(() => qb),
            select: jest.fn(() => qb),
            addSelect: jest.fn(() => qb),
            where: jest.fn(() => qb),
            andWhere: jest.fn(() => qb),
            groupBy: jest.fn(() => qb),
            getRawMany: jest.fn().mockImplementation(async () => {
              const sourceItems =
                state.savedPurchaseOrderItems ??
                state.purchaseOrder?.items ??
                [];
              return sourceItems
                .filter((item: any) => item.shippingDemandItemId != null)
                .map((item: any) => ({
                  shippingDemandItemId: String(item.shippingDemandItemId),
                  receivedQuantity: String(item.receivedQuantity ?? 0),
                }));
            }),
          };
          return qb;
        }),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedPurchaseOrderItems = Array.isArray(data) ? data : [data];
          return data;
        }),
      };
    }
    if (entity === ShippingDemandItem) {
      return {
        createQueryBuilder: jest.fn(() => {
          const qb = {
            innerJoin: jest.fn(() => qb),
            select: jest.fn(() => qb),
            addSelect: jest.fn(() => qb),
            where: jest.fn(() => qb),
            andWhere: jest.fn(() => qb),
            groupBy: jest.fn(() => qb),
            getRawMany: jest.fn().mockImplementation(async () => {
              const demandStatusById = new Map(
                (state.shippingDemands ?? []).map((demand: any) => [
                  Number(demand.id),
                  demand.status,
                ]),
              );
              const totals = new Map<
                number,
                {
                  purchaseQuantity: number;
                  useStockQuantity: number;
                  lockedQuantity: number;
                  shippedQuantity: number;
                }
              >();
              for (const item of state.shippingDemandItems ?? []) {
                if (
                  demandStatusById.get(Number(item.shippingDemandId)) ===
                  ShippingDemandStatus.VOIDED
                ) {
                  continue;
                }
                const key = Number(item.salesOrderItemId);
                const current = totals.get(key) ?? {
                  purchaseQuantity: 0,
                  useStockQuantity: 0,
                  lockedQuantity: 0,
                  shippedQuantity: 0,
                };
                current.purchaseQuantity += Number(
                  item.purchaseRequiredQuantity ?? 0,
                );
                current.useStockQuantity += Number(
                  item.stockRequiredQuantity ?? 0,
                );
                current.lockedQuantity += Number(
                  item.lockedRemainingQuantity ?? 0,
                );
                current.shippedQuantity += Number(item.shippedQuantity ?? 0);
                totals.set(key, current);
              }
              return [...totals.entries()].map(
                ([salesOrderItemId, aggregate]) => ({
                  salesOrderItemId: String(salesOrderItemId),
                  purchaseQuantity: String(aggregate.purchaseQuantity),
                  useStockQuantity: String(aggregate.useStockQuantity),
                  lockedQuantity: String(aggregate.lockedQuantity),
                  shippedQuantity: String(aggregate.shippedQuantity),
                }),
              );
            }),
          };
          return qb;
        }),
        find: jest.fn().mockResolvedValue(
          state.shippingDemandItems ?? makeShippingDemand().items,
        ),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedShippingDemandItems = Array.isArray(data) ? data : [data];
          syncShippingDemandItems(state, data);
          return data;
        }),
      };
    }
    if (entity === ShippingDemand) {
      return {
        createQueryBuilder: jest.fn(() => makeShippingDemandQueryBuilder(state)),
        save: jest.fn().mockImplementation(async (data) => {
          const items = Array.isArray(data) ? data : [data];
          state.shippingDemands = items.map((item: any) => ({
            ...item,
            items: [...(item.items ?? [])],
          }));
          state.savedShippingDemands = state.shippingDemands;
          return data;
        }),
      };
    }
    if (entity === ShippingDemandInventoryAllocation) {
      return {
        createQueryBuilder: jest.fn(() => {
          const qb = {
            select: jest.fn(() => qb),
            addSelect: jest.fn(() => qb),
            where: jest.fn(() => qb),
            andWhere: jest.fn(() => qb),
            groupBy: jest.fn(() => qb),
            getRawMany: jest.fn().mockImplementation(async () => {
              const totals = new Map<number, number>();
              for (const allocation of state.allocations ?? []) {
                if (
                  allocation.status !== ShippingDemandAllocationStatus.ACTIVE
                ) {
                  continue;
                }
                const key = Number(allocation.shippingDemandItemId);
                totals.set(
                  key,
                  (totals.get(key) ?? 0) +
                    Number(allocation.lockedQuantity ?? 0),
                );
              }
              return [...totals.entries()].map(
                ([shippingDemandItemId, lockedQuantity]) => ({
                  shippingDemandItemId: String(shippingDemandItemId),
                  lockedQuantity: String(lockedQuantity),
                }),
              );
            }),
          };
          return qb;
        }),
        create: jest.fn((data) => data),
        save: jest.fn().mockImplementation(async (data) => {
          const items = Array.isArray(data) ? data : [data];
          state.allocations = [...(state.allocations ?? []), ...items];
          state.savedAllocations = [...(state.savedAllocations ?? []), ...items];
          return data;
        }),
      };
    }
    if (entity === InventoryTransaction) {
      return {
        create: jest.fn((data) => data),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedInventoryTransactions = [
            ...(state.savedInventoryTransactions ?? []),
            ...(Array.isArray(data) ? data : [data]),
          ];
          return data;
        }),
      };
    }
    if (entity === SalesOrderItem) {
      return {
        find: jest.fn().mockResolvedValue(
          state.salesOrderItems ?? [makeSalesOrderItem()],
        ),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedSalesOrderItems = Array.isArray(data) ? data : [data];
          syncSalesOrderItems(state, data);
          return data;
        }),
      };
    }
    if (entity === SalesOrder) {
      return {
        createQueryBuilder: jest.fn(() => makeSalesOrderQueryBuilder(state)),
        save: jest.fn().mockImplementation(async (data) => {
          const item = { ...data };
          const nextOrders = (state.salesOrders ?? []).map((order: any) =>
            Number(order.id) === Number(item.id) ? item : order,
          );
          state.salesOrders = nextOrders.some(
            (order: any) => Number(order.id) === Number(item.id),
          )
            ? nextOrders
            : [...nextOrders, item];
          state.savedSalesOrders = [
            ...(state.savedSalesOrders ?? []),
            item,
          ];
          return item;
        }),
      };
    }
    if (entity === ReceiptOrder) {
      return {
        findOne: jest.fn().mockResolvedValue(null),
        createQueryBuilder: jest.fn(() => makeReceiptCodeQueryBuilder(state)),
        create: jest.fn((data) => data),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedReceiptOrder = { id: 800, ...data };
          return state.savedReceiptOrder;
        }),
      };
    }
    if (entity === ReceiptOrderItem) {
      return {
        create: jest.fn((data) => data),
        save: jest.fn().mockImplementation(async (data) => {
          if (data.id) {
            state.updatedReceiptItems = [
              ...(state.updatedReceiptItems ?? []),
              data,
            ];
            return data;
          }
          state.receiptItemSeq = (state.receiptItemSeq ?? 0) + 1;
          const saved = { id: 900 + state.receiptItemSeq, ...data };
          state.savedReceiptItems = [...(state.savedReceiptItems ?? []), saved];
          return saved;
        }),
      };
    }
    if (entity === Warehouse) {
      return {
        find: jest.fn().mockResolvedValue(state.warehouses ?? []),
      };
    }
    if (entity === User) {
      return {
        findOne: jest.fn().mockResolvedValue(state.receiver ?? null),
      };
    }
    if (entity === Company) {
      return {
        findOne: jest.fn().mockResolvedValue(state.company ?? null),
      };
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
    throw new Error(`Unexpected repository: ${String(entity)}`);
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

  let service: ReceiptOrdersService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-04-30T10:00:00.000Z'));
    service = new ReceiptOrdersService(
      receiptOrdersRepository as any,
      inventoryService as any,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('builds receipt prefill from remaining purchase quantities', async () => {
    const state: Record<string, any> = {
      purchaseOrder: makePurchaseOrder(),
      purchaseOrderQueryMode: 'find',
    };
    const queryRunner = makeQueryRunner(state);
    receiptOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);

    const result = await service.getCreatePrefill(500);

    expect(result.purchaseOrder).toEqual(
      expect.objectContaining({
        id: 500,
        poCode: 'XCPO202604300001',
        remainingTotalQuantity: 4,
      }),
    );
    expect(result.items).toEqual([
      expect.objectContaining({
        purchaseOrderItemId: 900,
        quantity: 5,
        receivedQuantity: 1,
        remainingQuantity: 4,
        unitPrice: 12.5,
      }),
    ]);
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('creates a confirmed receipt order and updates purchase order receipt status', async () => {
    const shippingDemand = makeShippingDemand();
    const state: Record<string, any> = {
      purchaseOrder: makePurchaseOrder(),
      purchaseOrderQueryMode: 'find',
      latestReceiptOrder: null,
      warehouses: [{ id: 10, name: '深圳仓' }],
      receiver: { id: 20, name: '仓管小李' },
      company: { id: 2, nameCn: '信达主体' },
      shippingDemands: [shippingDemand],
      shippingDemandItems: shippingDemand.items,
      salesOrders: [makeSalesOrder()],
      salesOrderItems: [makeSalesOrderItem()],
      allocations: [
        {
          shippingDemandItemId: 701,
          lockedQuantity: 1,
          status: ShippingDemandAllocationStatus.ACTIVE,
        },
      ],
    };
    const queryRunner = makeQueryRunner(state);
    receiptOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);
    receiptOrdersRepository.findBySourceActionKey.mockResolvedValue(null);
    receiptOrdersRepository.findById.mockResolvedValue({
      id: 800,
      receiptCode: 'RKDH202604300001',
      purchaseOrderId: 500,
      purchaseOrderCode: 'XCPO202604300001',
      status: ReceiptOrderStatus.CONFIRMED,
      totalQuantity: 4,
      totalAmount: '50.00',
    });
    inventoryService.increaseStockInTransaction.mockResolvedValue({
      summary: {},
      batches: [{ id: 7001 }],
    });
    inventoryService.lockStockInTransaction.mockResolvedValue({
      summary: {
        actualQuantity: 5,
        lockedQuantity: 5,
        availableQuantity: 0,
      },
      allocations: [{ batchId: 7001, quantity: 4 }],
    });

    const result = await service.create(
      {
        purchaseOrderId: 500,
        requestKey: 'receipt-order:test-1',
        receiptType: ReceiptOrderType.PURCHASE_RECEIPT,
        warehouseId: 10,
        receiptDate: '2026-04-30',
        receiverId: 20,
        purchaseCompanyId: 2,
        remark: '本次到货 4 台',
        inventoryNote: '常规采购入库',
        items: [
          {
            purchaseOrderItemId: 900,
            receivedQuantity: 4,
            warehouseId: 10,
            qcImageKeys: ['qc/a.png'],
          },
        ],
      },
      'admin',
    );

    expect(result).toEqual(
      expect.objectContaining({
        receiptCode: 'RKDH202604300001',
        purchaseOrderId: 500,
      }),
    );
    expect(state.savedReceiptOrder).toEqual(
      expect.objectContaining({
        receiptCode: 'RKDH202604300001',
        purchaseOrderCode: 'XCPO202604300001',
        totalQuantity: 4,
        totalAmount: '50.00',
        warehouseId: 10,
        receiverId: 20,
      }),
    );
    expect(inventoryService.increaseStockInTransaction).toHaveBeenCalledWith(
      queryRunner,
      expect.objectContaining({
        skuId: 11,
        warehouseId: 10,
        quantity: 4,
        sourceType: InventoryBatchSourceType.PURCHASE_RECEIPT,
        sourceDocumentId: 800,
        receiptDate: '2026-04-30',
      }),
    );
    expect(inventoryService.lockStockInTransaction).toHaveBeenCalledWith(
      queryRunner,
      expect.objectContaining({
        skuId: 11,
        warehouseId: 10,
        quantity: 4,
      }),
    );
    expect(state.updatedPurchaseOrder).toEqual(
      expect.objectContaining({
        id: 500,
        status: PurchaseOrderStatus.RECEIVED,
        receiptStatus: PurchaseOrderReceiptStatus.RECEIVED,
        receivedTotalQuantity: 5,
      }),
    );
    expect(state.savedPurchaseOrderItems).toEqual([
      expect.objectContaining({
        id: 900,
        receivedQuantity: 5,
        isFullyReceived: YesNo.YES,
      }),
    ]);
    expect(state.savedShippingDemandItems).toEqual([
      expect.objectContaining({
        id: 701,
        receivedQuantity: 5,
        lockedRemainingQuantity: 5,
      }),
    ]);
    expect(state.savedSalesOrderItems).toEqual([
      expect.objectContaining({
        id: 1201,
        purchaseQuantity: 5,
        useStockQuantity: 0,
        preparedQuantity: 5,
        shippedQuantity: 0,
      }),
    ]);
    expect(state.savedSalesOrders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1100,
          status: SalesOrderStatus.PREPARED,
        }),
      ]),
    );
    expect(state.savedInventoryTransactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          changeType: InventoryChangeType.LOCK,
          sourceDocumentType: 'receipt_order',
          sourceDocumentId: 800,
          sourceDocumentItemId: 901,
        }),
      ]),
    );
    expect(state.savedOperationLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: OperationLogAction.CREATE,
          resourceType: 'receipt-orders',
        }),
        expect.objectContaining({
          action: OperationLogAction.UPDATE,
          resourceType: 'purchase-orders',
        }),
        expect.objectContaining({
          action: OperationLogAction.UPDATE,
          resourceType: 'shipping-demands',
          requestSummary: expect.objectContaining({
            sourceAction: 'receipt_auto_lock',
          }),
        }),
        expect.objectContaining({
          action: OperationLogAction.UPDATE,
          resourceType: 'sales-orders',
          requestSummary: expect.objectContaining({
            sourceAction: 'receipt_auto_lock',
          }),
        }),
      ]),
    );
  });

  it('marks purchase order as partially received when only part of the remaining quantity arrives', async () => {
    const shippingDemand = makeShippingDemand();
    const state: Record<string, any> = {
      purchaseOrder: makePurchaseOrder(),
      purchaseOrderQueryMode: 'find',
      latestReceiptOrder: null,
      warehouses: [{ id: 10, name: '深圳仓' }],
      receiver: { id: 20, name: '仓管小李' },
      company: { id: 2, nameCn: '信达主体' },
      shippingDemands: [shippingDemand],
      shippingDemandItems: shippingDemand.items,
      salesOrders: [makeSalesOrder()],
      salesOrderItems: [makeSalesOrderItem()],
      allocations: [
        {
          shippingDemandItemId: 701,
          lockedQuantity: 1,
          status: ShippingDemandAllocationStatus.ACTIVE,
        },
      ],
    };
    const queryRunner = makeQueryRunner(state);
    receiptOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);
    receiptOrdersRepository.findBySourceActionKey.mockResolvedValue(null);
    receiptOrdersRepository.findById.mockResolvedValue({
      id: 800,
      receiptCode: 'RKDH202604300001',
      purchaseOrderId: 500,
      purchaseOrderCode: 'XCPO202604300001',
      status: ReceiptOrderStatus.CONFIRMED,
      totalQuantity: 2,
      totalAmount: '25.00',
    });
    inventoryService.increaseStockInTransaction.mockResolvedValue({
      summary: {},
      batches: [{ id: 7001 }],
    });
    inventoryService.lockStockInTransaction.mockResolvedValue({
      summary: {
        actualQuantity: 3,
        lockedQuantity: 3,
        availableQuantity: 0,
      },
      allocations: [{ batchId: 7001, quantity: 2 }],
    });

    await service.create(
      {
        purchaseOrderId: 500,
        requestKey: 'receipt-order:test-2',
        warehouseId: 10,
        receiptDate: '2026-04-30',
        receiverId: 20,
        purchaseCompanyId: 2,
        items: [
          {
            purchaseOrderItemId: 900,
            receivedQuantity: 2,
            warehouseId: 10,
          },
        ],
      },
      'admin',
    );

    expect(state.updatedPurchaseOrder).toEqual(
      expect.objectContaining({
        id: 500,
        status: PurchaseOrderStatus.PARTIALLY_RECEIVED,
        receiptStatus: PurchaseOrderReceiptStatus.PARTIALLY_RECEIVED,
        receivedTotalQuantity: 3,
      }),
    );
    expect(state.savedShippingDemandItems).toEqual([
      expect.objectContaining({
        id: 701,
        receivedQuantity: 3,
        lockedRemainingQuantity: 3,
      }),
    ]);
    expect(state.savedSalesOrderItems).toEqual([
      expect.objectContaining({
        id: 1201,
        preparedQuantity: 3,
      }),
    ]);
    expect(state.savedSalesOrders).toBeUndefined();
  });

  it('skips auto lock for stock purchase orders', async () => {
    const state: Record<string, any> = {
      purchaseOrder: makePurchaseOrder({
        orderType: PurchaseOrderType.STOCK,
        shippingDemandId: null,
        shippingDemandCode: null,
        items: [
          {
            id: 900,
            purchaseOrderId: 500,
            shippingDemandItemId: null,
            skuId: 11,
            skuCode: 'SKU001',
            productNameCn: '离心机',
            productType: '设备类',
            spuName: 'SPU001',
            quantity: 5,
            receivedQuantity: 1,
            unitPrice: '12.50',
            isFullyReceived: YesNo.NO,
          },
        ] as any,
      }),
      purchaseOrderQueryMode: 'find',
      latestReceiptOrder: null,
      warehouses: [{ id: 10, name: '深圳仓' }],
      receiver: { id: 20, name: '仓管小李' },
      company: { id: 2, nameCn: '信达主体' },
    };
    const queryRunner = makeQueryRunner(state);
    receiptOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);
    receiptOrdersRepository.findBySourceActionKey.mockResolvedValue(null);
    receiptOrdersRepository.findById.mockResolvedValue({
      id: 800,
      receiptCode: 'RKDH202604300001',
      purchaseOrderId: 500,
      purchaseOrderCode: 'XCPO202604300001',
      status: ReceiptOrderStatus.CONFIRMED,
      totalQuantity: 2,
      totalAmount: '25.00',
    });
    inventoryService.increaseStockInTransaction.mockResolvedValue({
      summary: {},
      batches: [{ id: 7001 }],
    });

    await service.create(
      {
        purchaseOrderId: 500,
        requestKey: 'receipt-order:test-stock',
        warehouseId: 10,
        receiptDate: '2026-04-30',
        receiverId: 20,
        purchaseCompanyId: 2,
        items: [
          {
            purchaseOrderItemId: 900,
            receivedQuantity: 2,
            warehouseId: 10,
          },
        ],
      },
      'admin',
    );

    expect(inventoryService.lockStockInTransaction).not.toHaveBeenCalled();
    expect(state.savedAllocations).toBeUndefined();
    expect(state.savedInventoryTransactions).toBeUndefined();
  });

  it('caps auto lock quantity by the remaining demand gap', async () => {
    const shippingDemand = makeShippingDemand({
      items: [
        {
          id: 701,
          shippingDemandId: 700,
          salesOrderItemId: 1201,
          skuId: 11,
          skuCode: 'SKU001',
          requiredQuantity: 5,
          lockedRemainingQuantity: 4,
          shippedQuantity: 0,
          purchaseRequiredQuantity: 5,
          stockRequiredQuantity: 0,
          purchaseOrderedQuantity: 5,
          receivedQuantity: 4,
        },
      ] as any,
    });
    const state: Record<string, any> = {
      purchaseOrder: makePurchaseOrder({
        receivedTotalQuantity: 4,
        items: [
          {
            id: 900,
            purchaseOrderId: 500,
            shippingDemandItemId: 701,
            skuId: 11,
            skuCode: 'SKU001',
            productNameCn: '离心机',
            productType: '设备类',
            spuName: 'SPU001',
            quantity: 7,
            receivedQuantity: 4,
            unitPrice: '12.50',
            isFullyReceived: YesNo.NO,
          },
        ] as any,
      }),
      purchaseOrderQueryMode: 'find',
      latestReceiptOrder: null,
      warehouses: [{ id: 10, name: '深圳仓' }],
      receiver: { id: 20, name: '仓管小李' },
      company: { id: 2, nameCn: '信达主体' },
      shippingDemands: [shippingDemand],
      shippingDemandItems: shippingDemand.items,
      salesOrders: [makeSalesOrder()],
      salesOrderItems: [makeSalesOrderItem({ preparedQuantity: 4 })],
      allocations: [
        {
          shippingDemandItemId: 701,
          lockedQuantity: 4,
          status: ShippingDemandAllocationStatus.ACTIVE,
        },
      ],
    };
    const queryRunner = makeQueryRunner(state);
    receiptOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);
    receiptOrdersRepository.findBySourceActionKey.mockResolvedValue(null);
    receiptOrdersRepository.findById.mockResolvedValue({
      id: 800,
      receiptCode: 'RKDH202604300001',
      purchaseOrderId: 500,
      purchaseOrderCode: 'XCPO202604300001',
      status: ReceiptOrderStatus.CONFIRMED,
      totalQuantity: 3,
      totalAmount: '37.50',
    });
    inventoryService.increaseStockInTransaction.mockResolvedValue({
      summary: {},
      batches: [{ id: 7002 }],
    });
    inventoryService.lockStockInTransaction.mockResolvedValue({
      summary: {
        actualQuantity: 7,
        lockedQuantity: 5,
        availableQuantity: 2,
      },
      allocations: [{ batchId: 7002, quantity: 1 }],
    });

    await service.create(
      {
        purchaseOrderId: 500,
        requestKey: 'receipt-order:test-gap-cap',
        warehouseId: 10,
        receiptDate: '2026-04-30',
        receiverId: 20,
        purchaseCompanyId: 2,
        items: [
          {
            purchaseOrderItemId: 900,
            receivedQuantity: 3,
            warehouseId: 10,
          },
        ],
      },
      'admin',
    );

    expect(inventoryService.lockStockInTransaction).toHaveBeenCalledWith(
      queryRunner,
      expect.objectContaining({
        skuId: 11,
        warehouseId: 10,
        quantity: 1,
      }),
    );
    expect(state.savedShippingDemandItems).toEqual([
      expect.objectContaining({
        id: 701,
        lockedRemainingQuantity: 5,
      }),
    ]);
  });

  it('rejects receipt quantity that exceeds remaining quantity', async () => {
    const state: Record<string, any> = {
      purchaseOrder: makePurchaseOrder(),
      purchaseOrderQueryMode: 'find',
      latestReceiptOrder: null,
      warehouses: [{ id: 10, name: '深圳仓' }],
      receiver: { id: 20, name: '仓管小李' },
      company: { id: 2, nameCn: '信达主体' },
    };
    const queryRunner = makeQueryRunner(state);
    receiptOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);
    receiptOrdersRepository.findBySourceActionKey.mockResolvedValue(null);

    await expect(
      service.create(
        {
          purchaseOrderId: 500,
          requestKey: 'receipt-order:test-3',
          warehouseId: 10,
          receiptDate: '2026-04-30',
          receiverId: 20,
          items: [
            {
              purchaseOrderItemId: 900,
              receivedQuantity: 9,
              warehouseId: 10,
            },
          ],
        },
        'admin',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(inventoryService.increaseStockInTransaction).not.toHaveBeenCalled();
  });

  it('returns existing receipt order when request key is repeated', async () => {
    receiptOrdersRepository.findBySourceActionKey.mockResolvedValue({
      id: 801,
    });
    receiptOrdersRepository.findById.mockResolvedValue({
      id: 801,
      receiptCode: 'RKDH202604300099',
      purchaseOrderId: 500,
      purchaseOrderCode: 'XCPO202604300001',
      status: ReceiptOrderStatus.CONFIRMED,
    });

    const result = await service.create(
      {
        purchaseOrderId: 500,
        requestKey: 'receipt-order:test-repeat',
        warehouseId: 10,
        receiptDate: '2026-04-30',
        receiverId: 20,
        items: [
          {
            purchaseOrderItemId: 900,
            receivedQuantity: 2,
            warehouseId: 10,
          },
        ],
      },
      'admin',
    );

    expect(result).toEqual(
      expect.objectContaining({ receiptCode: 'RKDH202604300099' }),
    );
    expect(receiptOrdersRepository.createQueryRunner).not.toHaveBeenCalled();
    expect(inventoryService.increaseStockInTransaction).not.toHaveBeenCalled();
  });
});
