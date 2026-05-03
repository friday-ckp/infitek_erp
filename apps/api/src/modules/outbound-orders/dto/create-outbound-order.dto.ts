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
import { OutboundOrderType } from '@infitek/shared';

export class CreateOutboundOrderItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  logisticsOrderItemId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  outboundQuantity: number;
}

export class CreateOutboundOrderDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  logisticsOrderId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  outboundUserId: number;

  @IsDateString()
  outboundDate: string;

  @IsString()
  @IsIn(Object.values(OutboundOrderType))
  outboundType: OutboundOrderType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  salesCompanyId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  warehouseId: number;

  @IsString()
  @MaxLength(160)
  requestKey: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  remark?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOutboundOrderItemDto)
  items: CreateOutboundOrderItemDto[];
}
