import { Transform, Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { InventoryChangeType } from '@infitek/shared';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export class QueryInventoryTransactionDto extends BaseQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  skuId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  warehouseId?: number;

  @IsOptional()
  @IsIn(Object.values(InventoryChangeType))
  changeType?: InventoryChangeType;

  @Transform(({ value }) => normalizeOptionalString(value))
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @Transform(({ value }) => normalizeOptionalString(value))
  @IsOptional()
  @IsDateString()
  endTime?: string;
}
