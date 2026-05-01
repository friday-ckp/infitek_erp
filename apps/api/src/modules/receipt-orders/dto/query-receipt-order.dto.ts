import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { ReceiptOrderStatus, ReceiptOrderType } from '@infitek/shared';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryReceiptOrderDto extends BaseQueryDto {
  @IsOptional()
  @IsIn(Object.values(ReceiptOrderType))
  receiptType?: ReceiptOrderType;

  @IsOptional()
  @IsIn(Object.values(ReceiptOrderStatus))
  status?: ReceiptOrderStatus;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  purchaseOrderId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  warehouseId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  receiverId?: number;
}
