import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { LogisticsOrderStatus } from '@infitek/shared';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryLogisticsOrderDto extends BaseQueryDto {
  @IsOptional()
  @IsIn(Object.values(LogisticsOrderStatus))
  status?: LogisticsOrderStatus;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  logisticsProviderId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  shippingDemandId?: number;
}
