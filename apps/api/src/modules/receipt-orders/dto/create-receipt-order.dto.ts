import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ReceiptOrderType } from '@infitek/shared';

export class CreateReceiptOrderItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  purchaseOrderItemId: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  receivedQuantity: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  warehouseId?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  qcImageKeys?: string[];
}

export class CreateReceiptOrderDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  purchaseOrderId: number;

  @IsString()
  @MaxLength(160)
  requestKey: string;

  @IsIn(Object.values(ReceiptOrderType))
  @IsOptional()
  receiptType?: ReceiptOrderType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  warehouseId: number;

  @IsDateString()
  receiptDate: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  receiverId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  purchaseCompanyId?: number;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  remark?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  inventoryNote?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateReceiptOrderItemDto)
  items: CreateReceiptOrderItemDto[];
}
