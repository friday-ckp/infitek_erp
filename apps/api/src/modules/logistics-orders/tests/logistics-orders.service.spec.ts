import { BadRequestException } from '@nestjs/common';
import {
  DomesticTradeType,
  LogisticsOrderStatus,
  ShippingDemandStatus,
  TransportationMethod,
  YesNo,
} from '@infitek/shared';
import {
  OperationLog,
  OperationLogAction,
} from '../../operation-logs/entities/operation-log.entity';
import { ShippingDemand } from '../../shipping-demands/entities/shipping-demand.entity';
import { LogisticsOrderItem } from '../entities/logistics-order-item.entity';
import { LogisticsOrderPackage } from '../entities/logistics-order-package.entity';
import { LogisticsOrder } from '../entities/logistics-order.entity';
import { LogisticsOrdersService } from '../logistics-orders.service';

describe('LogisticsOrdersService', () => {
  const logisticsOrdersRepository = {
    createQueryRunner: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    sumActivePlannedQuantityByDemandItemIds: jest.fn(),
  };

  const makeDemand = (
    overrides: Partial<ShippingDemand> = {},
  ): Partial<ShippingDemand> => ({
    id: 500,
    demandCode: 'SD2026042800001',
    salesOrderId: 10,
    sourceDocumentCode: 'SO2026042800001',
    status: ShippingDemandStatus.PREPARED,
    customerId: 1,
    customerName: '测试客户',
    customerCode: 'KH001',
    domesticTradeType: DomesticTradeType.FOREIGN,
    signingCompanyName: '星辰科技有限公司',
    destinationCountryId: 86,
    destinationCountryName: '中国',
    destinationPortId: 8,
    destinationPortName: '上海港',
    requiredDeliveryAt: '2026-05-20',
    requiresExportCustoms: YesNo.YES,
    consigneeCompany: 'Consignee Co.',
    consigneeOtherInfo: 'Consignee Info',
    notifyCompany: 'Notify Co.',
    notifyOtherInfo: 'Notify Info',
    shipperCompany: 'Shipper Co.',
    shipperOtherInfoCompanyName: 'Shipper Info',
    usesDefaultShippingMark: YesNo.YES,
    shippingMarkNote: '唛头备注',
    needsInvoice: YesNo.YES,
    invoiceType: null,
    shippingDocumentsNote: '随货文件',
    blType: null,
    originalMailAddress: 'Mail address',
    customsDocumentNote: '清关要求',
    otherRequirementNote: '其他要求',
    items: [
      {
        id: 700,
        salesOrderItemId: 101,
        skuId: 11,
        skuCode: 'SKU001',
        productNameCn: '离心机',
        productNameEn: 'Centrifuge',
        skuSpecification: '220V',
        unitId: 6,
        unitName: '台',
        lockedRemainingQuantity: 5,
      },
    ] as any,
    ...overrides,
  });

  const makeQueryBuilder = (result: unknown) => {
    const qb = {
      leftJoinAndSelect: jest.fn(() => qb),
      setLock: jest.fn(() => qb),
      where: jest.fn(() => qb),
      orderBy: jest.fn(() => qb),
      getOne: jest.fn().mockResolvedValue(result),
    };
    return qb;
  };

  const makeRepository = (entity: unknown, state: Record<string, unknown>) => {
    if (entity === ShippingDemand) {
      return {
        createQueryBuilder: jest.fn(() => makeQueryBuilder(state.demand)),
      };
    }
    if (entity === LogisticsOrder) {
      return {
        createQueryBuilder: jest.fn(() => makeQueryBuilder(null)),
        create: jest.fn((data) => data),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedOrder = { id: 900, ...data };
          return state.savedOrder;
        }),
      };
    }
    if (entity === LogisticsOrderItem) {
      return {
        createQueryBuilder: jest.fn(() => {
          const qb = {
            innerJoin: jest.fn(() => qb),
            select: jest.fn(() => qb),
            addSelect: jest.fn(() => qb),
            where: jest.fn(() => qb),
            andWhere: jest.fn(() => qb),
            groupBy: jest.fn(() => qb),
            getRawMany: jest
              .fn()
              .mockResolvedValue((state.activePlannedRows as unknown[]) ?? []),
          };
          return qb;
        }),
        create: jest.fn((data) => data),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedItems = data;
          return data;
        }),
      };
    }
    if (entity === LogisticsOrderPackage) {
      return {
        create: jest.fn((data) => data),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedPackages = data;
          return data;
        }),
      };
    }
    if (entity === OperationLog) {
      return {
        create: jest.fn((data) => data),
        save: jest.fn().mockImplementation(async (data) => {
          state.savedOperationLog = { id: 1000, ...data };
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

  let service: LogisticsOrdersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LogisticsOrdersService(logisticsOrdersRepository as any);
  });

  it('builds create prefill from locked unplanned quantities', async () => {
    const state: Record<string, unknown> = {
      demand: makeDemand(),
      activePlannedRows: [],
    };
    const queryRunner = makeQueryRunner(state);
    logisticsOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);
    logisticsOrdersRepository.sumActivePlannedQuantityByDemandItemIds.mockResolvedValue(
      new Map([[700, 2]]),
    );

    const result = await service.getCreatePrefill(500);

    expect(result.shippingDemand).toEqual(expect.objectContaining({ id: 500 }));
    expect(result.planItems).toEqual([
      expect.objectContaining({
        shippingDemandItemId: 700,
        lockedRemainingQuantity: 5,
        activePlannedQuantity: 2,
        availableToPlan: 3,
        plannedQuantity: 3,
      }),
    ]);
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('creates confirmed logistics order without touching inventory', async () => {
    const state: Record<string, unknown> = { demand: makeDemand() };
    const queryRunner = makeQueryRunner(state);
    logisticsOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);
    logisticsOrdersRepository.findById.mockResolvedValue({
      id: 900,
      orderCode: 'LO2026042900001',
      status: LogisticsOrderStatus.CONFIRMED,
      items: [{ id: 1, plannedQuantity: 5 }],
    });

    const result = await service.create(
      {
        shippingDemandId: 500,
        logisticsProviderId: 30,
        logisticsProviderName: '顺丰国际',
        transportationMethod: TransportationMethod.SEA,
        companyId: 40,
        companyName: '星辰科技有限公司',
        originPortName: '深圳',
        destinationPortId: 8,
        destinationPortName: '上海港',
        destinationCountryId: 86,
        destinationCountryName: '中国',
        requiresExportCustoms: YesNo.YES,
        items: [{ shippingDemandItemId: 700, plannedQuantity: 5 }],
        packages: [
          {
            packageNo: 'PKG-001',
            quantityPerBox: 1,
            boxCount: 5,
            totalQuantity: 5,
            lengthCm: 10,
            widthCm: 20,
            heightCm: 30,
            grossWeightKg: 50,
          },
        ],
      },
      'admin',
    );

    expect(result.status).toBe(LogisticsOrderStatus.CONFIRMED);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(state.savedOrder).toEqual(
      expect.objectContaining({
        shippingDemandId: 500,
        shippingDemandCode: 'SD2026042800001',
        status: LogisticsOrderStatus.CONFIRMED,
        logisticsProviderName: '顺丰国际',
        transportationMethod: TransportationMethod.SEA,
      }),
    );
    expect(state.savedItems).toEqual([
      expect.objectContaining({
        shippingDemandItemId: 700,
        skuCode: 'SKU001',
        lockedRemainingQuantity: 5,
        plannedQuantity: 5,
        outboundQuantity: 0,
      }),
    ]);
    expect(state.savedPackages).toEqual([
      expect.objectContaining({
        packageNo: 'PKG-001',
        totalQuantity: 5,
        grossWeightKg: '50',
      }),
    ]);
    expect(state.savedOperationLog).toEqual(
      expect.objectContaining({
        action: OperationLogAction.CREATE,
        resourceType: 'logistics-orders',
        resourceId: '900',
      }),
    );
  });

  it('rejects planning more than locked unplanned quantity', async () => {
    const state: Record<string, unknown> = {
      demand: makeDemand(),
      activePlannedRows: [
        { shippingDemandItemId: '700', plannedQuantity: '3' },
      ],
    };
    const queryRunner = makeQueryRunner(state);
    logisticsOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);

    await expect(
      service.create(
        {
          shippingDemandId: 500,
          logisticsProviderId: 30,
          logisticsProviderName: '顺丰国际',
          transportationMethod: TransportationMethod.SEA,
          companyId: 40,
          companyName: '星辰科技有限公司',
          originPortName: '深圳',
          destinationPortName: '上海港',
          destinationCountryName: '中国',
          items: [{ shippingDemandItemId: 700, plannedQuantity: 3 }],
          packages: [
            {
              packageNo: 'PKG-001',
              quantityPerBox: 1,
              boxCount: 3,
              totalQuantity: 3,
            },
          ],
        },
        'admin',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(state.savedOrder).toBeUndefined();
  });

  it('rejects logistics order creation from non-prepared demand', async () => {
    const state: Record<string, unknown> = {
      demand: makeDemand({ status: ShippingDemandStatus.PURCHASING }),
    };
    const queryRunner = makeQueryRunner(state);
    logisticsOrdersRepository.createQueryRunner.mockReturnValue(queryRunner);

    await expect(service.getCreatePrefill(500)).rejects.toThrow(
      BadRequestException,
    );
  });
});
