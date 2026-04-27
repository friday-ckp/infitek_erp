import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryAvailableInventoryDto } from '../dto/query-available-inventory.dto';

describe('QueryAvailableInventoryDto', () => {
  async function validateQuery(input: Record<string, unknown>) {
    const dto = plainToInstance(QueryAvailableInventoryDto, input);
    const errors = await validate(dto);
    return { dto, errors };
  }

  it('parses comma-separated skuIds', async () => {
    const { dto, errors } = await validateQuery({
      skuIds: '3,1,2',
      warehouseId: '8',
    });

    expect(errors).toHaveLength(0);
    expect(dto.skuIds).toEqual([3, 1, 2]);
    expect(dto.warehouseId).toBe(8);
  });

  it('rejects invalid skuId tokens instead of dropping them', async () => {
    const { dto, errors } = await validateQuery({ skuIds: '1,abc' });

    expect(dto.skuIds).toHaveLength(2);
    expect(Number.isNaN(dto.skuIds[1])).toBe(true);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('skuIds');
  });
});
