import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

function parseSkuIds(value: unknown): number[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (Array.isArray(value)) {
    const skuIds = value.flatMap((item) => parseSkuIds(item) ?? []);
    return skuIds.length > 0 ? skuIds : undefined;
  }
  if (typeof value === 'number') {
    return [value];
  }
  if (typeof value !== 'string') {
    return [Number.NaN];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .map((item) => (item === '' ? Number.NaN : Number(item)));
}

export class QueryAvailableInventoryDto {
  @Transform(({ value }) => parseSkuIds(value))
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  skuIds?: number[];

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  warehouseId?: number;
}
