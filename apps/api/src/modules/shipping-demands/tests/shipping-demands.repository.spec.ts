import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ShippingDemandStatus } from '@infitek/shared';
import { QueryShippingDemandDto } from '../dto/query-shipping-demand.dto';
import { ShippingDemandsRepository } from '../shipping-demands.repository';

describe('ShippingDemandsRepository', () => {
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

  it('filters list by status, customer, sales order, source document and returns sku count', async () => {
    const rows = [
      {
        id: 500,
        demandCode: 'SD2026042800001',
        skuCount: 2,
      },
    ];
    const qb = makeQueryBuilder(rows, 1);
    const shippingDemandRepo = {
      createQueryBuilder: jest.fn(() => qb),
    };
    const repository = new ShippingDemandsRepository(
      { createQueryRunner: jest.fn() } as any,
      shippingDemandRepo as any,
      {} as any,
    );

    const result = await repository.findAll({
      keyword: '客户A',
      status: ShippingDemandStatus.PENDING_ALLOCATION,
      customerId: 12,
      salesOrderId: 34,
      sourceDocumentCode: ' SO_20260428% ',
      page: 2,
      pageSize: 10,
    });

    expect(shippingDemandRepo.createQueryBuilder).toHaveBeenCalledWith(
      'demand',
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      '(demand.demand_code LIKE :kw OR demand.source_document_code LIKE :kw OR demand.customer_name LIKE :kw OR demand.customer_code LIKE :kw)',
      { kw: '%客户A%' },
    );
    expect(qb.andWhere).toHaveBeenCalledWith('demand.status = :status', {
      status: ShippingDemandStatus.PENDING_ALLOCATION,
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'demand.customer_id = :customerId',
      {
        customerId: 12,
      },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'demand.sales_order_id = :salesOrderId',
      {
        salesOrderId: 34,
      },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'demand.source_document_code LIKE :sourceDocumentCode ESCAPE \'\\\\\'',
      { sourceDocumentCode: '%SO\\_20260428\\%%' },
    );
    expect(qb.loadRelationCountAndMap).toHaveBeenCalledWith(
      'demand.skuCount',
      'demand.items',
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

  it('ignores blank source document filters', async () => {
    const qb = makeQueryBuilder([], 0);
    const shippingDemandRepo = {
      createQueryBuilder: jest.fn(() => qb),
    };
    const repository = new ShippingDemandsRepository(
      { createQueryRunner: jest.fn() } as any,
      shippingDemandRepo as any,
      {} as any,
    );

    await repository.findAll({
      sourceDocumentCode: '   ',
      page: 1,
      pageSize: 20,
    });

    expect(qb.andWhere).not.toHaveBeenCalledWith(
      expect.stringContaining('source_document_code'),
      expect.anything(),
    );
  });
});

describe('QueryShippingDemandDto', () => {
  async function validateQuery(input: Record<string, unknown>) {
    const dto = plainToInstance(QueryShippingDemandDto, input);
    const errors = await validate(dto);
    return { dto, errors };
  }

  it('trims source document code and normalizes blanks', async () => {
    const { dto: trimmedDto, errors: trimmedErrors } = await validateQuery({
      sourceDocumentCode: ' SO20260428 ',
    });
    const { dto: blankDto, errors: blankErrors } = await validateQuery({
      sourceDocumentCode: '   ',
    });

    expect(trimmedErrors).toHaveLength(0);
    expect(trimmedDto.sourceDocumentCode).toBe('SO20260428');
    expect(blankErrors).toHaveLength(0);
    expect(blankDto.sourceDocumentCode).toBeUndefined();
  });

  it('rejects overlong source document code filters', async () => {
    const { errors } = await validateQuery({
      sourceDocumentCode: 'S'.repeat(101),
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('sourceDocumentCode');
  });
});
