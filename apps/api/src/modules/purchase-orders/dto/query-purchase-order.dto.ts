import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { PurchaseOrderStatus, PurchaseOrderType } from '@infitek/shared';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryPurchaseOrderDto extends BaseQueryDto {
  @IsOptional()
  @IsIn(Object.values(PurchaseOrderStatus))
  status?: PurchaseOrderStatus;

  @IsOptional()
  @IsIn(Object.values(PurchaseOrderType))
  orderType?: PurchaseOrderType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  supplierId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  shippingDemandId?: number;
}
