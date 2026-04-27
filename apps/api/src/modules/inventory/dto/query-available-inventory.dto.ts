import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

function parseSkuIds(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => parseSkuIds(item));
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
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  skuIds: number[];

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  warehouseId?: number;
}
