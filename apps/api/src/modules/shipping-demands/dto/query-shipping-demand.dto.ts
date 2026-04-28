import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ShippingDemandStatus } from '@infitek/shared';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryShippingDemandDto extends BaseQueryDto {
  @IsOptional()
  @IsIn(Object.values(ShippingDemandStatus))
  status?: ShippingDemandStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customerId?: number;
}
