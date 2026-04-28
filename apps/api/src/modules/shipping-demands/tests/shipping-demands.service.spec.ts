import { BadRequestException } from '@nestjs/common';
import {
  DomesticTradeType,
  SalesOrderStatus,
  SalesOrderType,
  ShippingDemandStatus,
} from '@infitek/shared';
import {
  OperationLog,
  OperationLogAction,
} from '../../operation-logs/entities/operation-log.entity';
import { SalesOrder } from '../../sales-orders/entities/sales-order.entity';
import { ShippingDemandItem } from '../entities/shipping-demand-item.entity';
import { ShippingDemand } from '../entities/shipping-demand.entity';
import { ShippingDemandsService } from '../shipping-demands.service';

describe('ShippingDemandsService', () => {
  const shippingDemandsRepository = {
    createQueryRunner: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
  };
  const inventoryService = {
    findAvailable: jest.fn(),
  };

  const makeOrder = (
    status = SalesOrderStatus.APPROVED,
  ): Partial<SalesOrder> => ({
    id: 10,
    erpSalesOrderCode: 'SO2026042800001',
    status,
    orderType: SalesOrderType.SALES,
    domesticTradeType: DomesticTradeType.FOREIGN,
    customerId: 1,
    customerName: '测试客户',
    customerCode: 'KH001',
    currencyId: 2,
    currencyCode: 'USD',
    currencyName: '美元',
    currencySymbol: '$',
    tradeTerm: null,
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
    requiresExportCustoms: null,
    requiresWarrantyCard: null,
    requiresCustomsCertificate: null,
    usesMarketingFund: null,
    contractAmount: '1000.00',
    receivedAmount: '0.00',
    outstandingAmount: '1000.00',
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

  const makeQueryBuilder = (result: unknown) => {
    const qb = {
      leftJoinAndSelect: jest.fn(() => qb),
      setLock: jest.fn(() => qb),
      where: jest.fn(() => qb),
      andWhere: jest.fn(() => qb),
      orderBy: jest.fn(() => qb),
      getOne: jest.fn().mockResolvedValue(result),
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
    if (entity === ShippingDemand) {
      return {
        createQueryBuilder: jest.fn(() =>
          makeQueryBuilder(state.existingDemand ?? state.latestDemand ?? null),
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
          state.savedItems = data;
          return data;
        }),
      };
    }
    if (entity === OperationLog) {
      return {
        create: jest.fn((data) => data),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedOperationLog = { id: 900, ...data };
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
      }),
    );
    expect(state.savedItems).toEqual([
      expect.objectContaining({
        salesOrderItemId: 101,
        requiredQuantity: 2,
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
