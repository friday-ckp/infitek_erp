import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LogisticsOrderStatus } from '@infitek/shared';
import { QueryLogisticsOrderDto } from '../dto/query-logistics-order.dto';
import { LogisticsOrdersRepository } from '../logistics-orders.repository';

describe('LogisticsOrdersRepository', () => {
  const makeQueryBuilder = (list: unknown[] = [], total = 0) => {
    const qb = {
      andWhere: jest.fn(() => qb),
      loadRelationCountAndMap: jest.fn(() => qb),
      orderBy: jest.fn(() => qb),
      skip: jest.fn(() => qb),
      take: jest.fn(() => qb),
      getManyAndCount: jest.fn().mockResolvedValue([list, total]),
    };
    return qb;
  };

  it('filters list by keyword, status, logistics provider and shipping demand', async () => {
    const rows = [{ id: 1, orderCode: 'LOG20260502001' }];
    const qb = makeQueryBuilder(rows, 1);
    const logisticsOrderRepo = {
      createQueryBuilder: jest.fn(() => qb),
    };
    const repository = new LogisticsOrdersRepository(
      { createQueryRunner: jest.fn() } as any,
      logisticsOrderRepo as any,
      {} as any,
      {} as any,
    );

    const result = await repository.findAll({
      keyword: ' LOG_20260502% ',
      status: LogisticsOrderStatus.CONFIRMED,
      logisticsProviderId: 33,
      shippingDemandId: 55,
      page: 2,
      pageSize: 10,
    });

    expect(logisticsOrderRepo.createQueryBuilder).toHaveBeenCalledWith(
      'logisticsOrder',
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      '(logisticsOrder.order_code LIKE :kw ESCAPE \'\\\\\' OR logisticsOrder.shipping_demand_code LIKE :kw ESCAPE \'\\\\\' OR logisticsOrder.sales_order_code LIKE :kw ESCAPE \'\\\\\' OR logisticsOrder.customer_name LIKE :kw ESCAPE \'\\\\\')',
      { kw: '%LOG\\_20260502\\%%' },
    );
    expect(qb.andWhere).toHaveBeenCalledWith('logisticsOrder.status = :status', {
      status: LogisticsOrderStatus.CONFIRMED,
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'logisticsOrder.logistics_provider_id = :logisticsProviderId',
      { logisticsProviderId: 33 },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'logisticsOrder.shipping_demand_id = :shippingDemandId',
      { shippingDemandId: 55 },
    );
    expect(qb.skip).toHaveBeenCalledWith(10);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      list: rows,
      total: 1,
      page: 2,
      pageSize: 10,
      totalPages: 1,
    });
  });
});

describe('QueryLogisticsOrderDto', () => {
  it('accepts valid status and provider filters', async () => {
    const dto = plainToInstance(QueryLogisticsOrderDto, {
      status: LogisticsOrderStatus.CONFIRMED,
      logisticsProviderId: '12',
      shippingDemandId: '30',
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.logisticsProviderId).toBe(12);
    expect(dto.shippingDemandId).toBe(30);
  });
});
