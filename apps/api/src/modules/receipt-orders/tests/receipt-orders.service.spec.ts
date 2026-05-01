import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  InventoryBatchSourceType,
  PurchaseOrderReceiptStatus,
  PurchaseOrderStatus,
  ReceiptOrderStatus,
  ReceiptOrderType,
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
import { ShippingDemandItem } from '../../shipping-demands/entities/shipping-demand-item.entity';
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
  };

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

  const makeRepository = (entity: unknown, state: Record<string, any>) => {
    if (entity === PurchaseOrder) {
      return {
        createQueryBuilder: jest.fn(() => {
          if (state.purchaseOrderQueryMode === 'find') {
            return makePurchaseOrderQueryBuilder(state);
          }
          return makeReceiptCodeQueryBuilder(state);
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
        find: jest.fn().mockResolvedValue(
          state.shippingDemandItems ?? [
            {
              id: 701,
              receivedQuantity: 1,
            },
          ],
        ),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedShippingDemandItems = Array.isArray(data) ? data : [data];
          return data;
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
    expect(state.savedPurchaseOrder).toEqual(
      expect.objectContaining({
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
      }),
    ]);
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
      ]),
    );
  });

  it('marks purchase order as partially received when only part of the remaining quantity arrives', async () => {
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

    expect(state.savedPurchaseOrder).toEqual(
      expect.objectContaining({
        status: PurchaseOrderStatus.PARTIALLY_RECEIVED,
        receiptStatus: PurchaseOrderReceiptStatus.PARTIALLY_RECEIVED,
        receivedTotalQuantity: 3,
      }),
    );
    expect(state.savedShippingDemandItems).toEqual([
      expect.objectContaining({
        id: 701,
        receivedQuantity: 3,
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
