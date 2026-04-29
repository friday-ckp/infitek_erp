import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryLogisticsOrderDto extends BaseQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  shippingDemandId?: number;
}
