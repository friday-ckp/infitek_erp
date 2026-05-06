import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { OutboundOrderStatus, OutboundOrderType } from '@infitek/shared';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryOutboundOrderDto extends BaseQueryDto {
  @IsOptional()
  @IsIn(Object.values(OutboundOrderStatus))
  status?: OutboundOrderStatus;

  @IsOptional()
  @IsIn(Object.values(OutboundOrderType))
  outboundType?: OutboundOrderType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  logisticsOrderId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  shippingDemandId?: number;
}
