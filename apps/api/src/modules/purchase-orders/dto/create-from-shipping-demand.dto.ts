import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreatePurchaseOrderFromDemandItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  shippingDemandItemId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreatePurchaseOrderFromDemandGroupDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  supplierId: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  contractTermId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  remark?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderFromDemandItemDto)
  items: CreatePurchaseOrderFromDemandItemDto[];
}

export class CreatePurchaseOrdersFromShippingDemandDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  shippingDemandId: number;

  @IsString()
  @MaxLength(120)
  requestKey: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderFromDemandGroupDto)
  groups: CreatePurchaseOrderFromDemandGroupDto[];
}
