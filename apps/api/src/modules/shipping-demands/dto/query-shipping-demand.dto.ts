import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ShippingDemandStatus } from '@infitek/shared';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export class QueryShippingDemandDto extends BaseQueryDto {
  @IsOptional()
  @IsIn(Object.values(ShippingDemandStatus))
  status?: ShippingDemandStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  salesOrderId?: number;

  @IsOptional()
  @Transform(({ value }) => normalizeOptionalString(value))
  @IsString()
  @MaxLength(100)
  sourceDocumentCode?: string;
}
