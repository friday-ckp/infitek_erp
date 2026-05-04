import {
  LogisticsOrderStatus,
  SalesOrderStatus,
  ShippingDemandStatus,
} from '@infitek/shared';
import { LogisticsOrder } from '../../logistics-orders/entities/logistics-order.entity';
import { LogisticsOrderItem } from '../../logistics-orders/entities/logistics-order-item.entity';
import { OperationLog } from '../../operation-logs/entities/operation-log.entity';
import { SalesOrder } from '../../sales-orders/entities/sales-order.entity';
import { ShippingDemand } from '../../shipping-demands/entities/shipping-demand.entity';
import { OutboundOrdersService } from '../outbound-orders.service';

describe('OutboundOrdersService', () => {
  const outboundOrdersRepository = {
    createQueryRunner: jest.fn(),
    findById: jest.fn(),
    findBySourceActionKey: jest.fn(),
  };
  const inventoryService = {
    deductLockedStockInTransaction: jest.fn(),
  };

  let service: OutboundOrdersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OutboundOrdersService(
      outboundOrdersRepository as any,
      inventoryService as any,
    );
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('pushes sales order to partially shipped when any active demand is partially shipped', async () => {
    const savedOrders: Array<Record<string, unknown>> = [];
    const demandQueryBuilder = {
      select: jest.fn(),
      addSelect: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      setParameters: jest.fn(),
      groupBy: jest.fn(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          salesOrderId: '10',
          hasShipmentProgress: '1',
          allShipped: '0',
        },
      ]),
    };
    demandQueryBuilder.select.mockReturnValue(demandQueryBuilder);
    demandQueryBuilder.addSelect.mockReturnValue(demandQueryBuilder);
    demandQueryBuilder.where.mockReturnValue(demandQueryBuilder);
    demandQueryBuilder.andWhere.mockReturnValue(demandQueryBuilder);
    demandQueryBuilder.setParameters.mockReturnValue(demandQueryBuilder);
    demandQueryBuilder.groupBy.mockReturnValue(demandQueryBuilder);

    const salesOrderQueryBuilder = {
      setLock: jest.fn(),
      where: jest.fn(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 10,
          status: SalesOrderStatus.PREPARED,
          updatedBy: null,
        },
      ]),
    };
    salesOrderQueryBuilder.setLock.mockReturnValue(salesOrderQueryBuilder);
    salesOrderQueryBuilder.where.mockReturnValue(salesOrderQueryBuilder);

    const queryRunner = {
      manager: {
        getRepository: jest.fn((entity) => {
          if (entity === ShippingDemand) {
            return {
              createQueryBuilder: jest.fn(() => demandQueryBuilder),
            };
          }
          if (entity === SalesOrder) {
            return {
              createQueryBuilder: jest.fn(() => salesOrderQueryBuilder),
              save: jest.fn(async (order) => {
                savedOrders.push(order);
                return order;
              }),
            };
          }
          throw new Error('Unexpected repository');
        }),
      },
    };

    const changes = await (service as any).updateSalesOrderStatusesAfterOutbound(
      queryRunner,
      [{ salesOrderId: 10 }],
      'admin',
    );

    expect(changes).toHaveLength(1);
    expect(changes[0].oldStatus).toBe(SalesOrderStatus.PREPARED);
    expect(changes[0].order.status).toBe(SalesOrderStatus.PARTIALLY_SHIPPED);
    expect(savedOrders).toEqual([
      expect.objectContaining({
        id: 10,
        status: SalesOrderStatus.PARTIALLY_SHIPPED,
        updatedBy: 'admin',
      }),
    ]);
  });

  it('pushes shipping demand to partially shipped when any item has shipped quantity', async () => {
    const savedDemands: Array<Record<string, unknown>> = [];
    const queryRunner = {
      manager: {
        getRepository: jest.fn((entity) => {
          if (entity === ShippingDemand) {
            return {
              save: jest.fn(async (demand) => {
                savedDemands.push(demand);
                return demand;
              }),
            };
          }
          throw new Error('Unexpected repository');
        }),
      },
    };

    const changes = await (service as any).updateShippingDemandStatusesAfterOutbound(
      queryRunner,
      [
        {
          id: 100,
          status: ShippingDemandStatus.PREPARED,
          salesOrderId: 10,
          items: [
            { shippedQuantity: 2, requiredQuantity: 5 },
            { shippedQuantity: 0, requiredQuantity: 3 },
          ],
        },
      ],
      'admin',
    );

    expect(changes).toHaveLength(1);
    expect(changes[0].oldStatus).toBe(ShippingDemandStatus.PREPARED);
    expect(changes[0].demand.status).toBe(
      ShippingDemandStatus.PARTIALLY_SHIPPED,
    );
    expect(savedDemands).toEqual([
      expect.objectContaining({
        id: 100,
        status: ShippingDemandStatus.PARTIALLY_SHIPPED,
        updatedBy: 'admin',
      }),
    ]);
  });

  it('keeps logistics order confirmed when there are remaining outbound quantities', async () => {
    const save = jest.fn();
    const queryRunner = {
      manager: {
        getRepository: jest.fn((entity) => {
          if (entity === LogisticsOrderItem) {
            return {
              find: jest.fn().mockResolvedValue([
                { plannedQuantity: 5, outboundQuantity: 3 },
              ]),
            };
          }
          if (entity === LogisticsOrder) {
            return {
              save,
            };
          }
          throw new Error('Unexpected repository');
        }),
      },
    };

    const result = await (service as any).updateLogisticsOrderStatusAfterOutbound(
      queryRunner,
      {
        id: 200,
        status: LogisticsOrderStatus.CONFIRMED,
      },
      'admin',
    );

    expect(result).toBeNull();
    expect(save).not.toHaveBeenCalled();
  });

  it('writes logistics status change into operation log when outbound completes shipment', async () => {
    const savedLogs: Array<Record<string, unknown>> = [];
    const queryRunner = {
      manager: {
        getRepository: jest.fn((entity) => {
          if (entity === OperationLog) {
            return {
              create: jest.fn((data) => data),
              save: jest.fn(async (log) => {
                savedLogs.push(log);
                return log;
              }),
            };
          }
          throw new Error('Unexpected repository');
        }),
      },
    };

    await (service as any).writeLogisticsOrderOutboundOperationLog(
      queryRunner,
      {
        id: 300,
        status: LogisticsOrderStatus.SHIPPED,
      },
      {
        id: 400,
        outboundCode: 'QTCK202605040001',
      },
      [
        {
          logisticsItem: {
            id: 1,
            skuCode: 'SKU-001',
            productNameCn: '测试产品',
            productNameEn: 'Test Product',
          },
          warehouseName: '主仓',
          requestedQuantity: 2,
        },
      ],
      'admin',
      LogisticsOrderStatus.CONFIRMED,
    );

    expect(savedLogs).toHaveLength(1);
    expect(savedLogs[0].changeSummary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'status',
          oldValue: LogisticsOrderStatus.CONFIRMED,
          newValue: LogisticsOrderStatus.SHIPPED,
        }),
        expect.objectContaining({
          field: 'outboundSummary',
        }),
      ]),
    );
  });
});
