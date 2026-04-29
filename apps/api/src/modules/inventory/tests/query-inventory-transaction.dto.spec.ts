import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { InventoryChangeType } from '@infitek/shared';
import { QueryInventoryTransactionDto } from '../dto/query-inventory-transaction.dto';

describe('QueryInventoryTransactionDto', () => {
  async function validateQuery(input: Record<string, unknown>) {
    const dto = plainToInstance(QueryInventoryTransactionDto, input);
    const errors = await validate(dto);
    return { dto, errors };
  }

  it('normalizes IDs, dates and pagination values', async () => {
    const { dto, errors } = await validateQuery({
      skuId: '11',
      warehouseId: '22',
      changeType: InventoryChangeType.PURCHASE_RECEIPT,
      startTime: '2026-04-01',
      endTime: '2026-04-29',
      page: '2',
      pageSize: '10',
    });

    expect(errors).toHaveLength(0);
    expect(dto).toEqual(
      expect.objectContaining({
        skuId: 11,
        warehouseId: 22,
        changeType: InventoryChangeType.PURCHASE_RECEIPT,
        startTime: '2026-04-01',
        endTime: '2026-04-29',
        page: 2,
        pageSize: 10,
      }),
    );
  });

  it('rejects invalid change type and date values', async () => {
    const { errors } = await validateQuery({
      changeType: 'adjustment',
      startTime: 'bad-date',
    });

    expect(errors.map((error) => error.property).sort()).toEqual([
      'changeType',
      'startTime',
    ]);
  });
});
