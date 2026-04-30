import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  PurchaseOrderApplicationType,
  PurchaseOrderDemandType,
  PurchaseOrderSettlementDateType,
  PurchaseOrderSettlementType,
  YesNo,
} from '@infitek/shared';

export class CreatePurchaseOrderItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  skuId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreatePurchaseOrderDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  supplierId: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  contractTermId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  purchaseCompanyId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  currencyId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  purchaserId?: number;

  @IsString()
  @IsOptional()
  purchaseDate?: string;

  @IsString()
  @IsOptional()
  poDeliveryDate?: string;

  @IsString()
  @IsOptional()
  arrivalDate?: string;

  @IsIn(Object.values(YesNo))
  @IsOptional()
  isPrepaid?: YesNo;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  prepaidRatio?: number;

  @IsIn(Object.values(PurchaseOrderApplicationType))
  @IsOptional()
  applicationType?: PurchaseOrderApplicationType;

  @IsIn(Object.values(PurchaseOrderDemandType))
  @IsOptional()
  demandType?: PurchaseOrderDemandType;

  @IsIn(Object.values(PurchaseOrderSettlementDateType))
  @IsOptional()
  settlementDateType?: PurchaseOrderSettlementDateType;

  @IsIn(Object.values(PurchaseOrderSettlementType))
  @IsOptional()
  settlementType?: PurchaseOrderSettlementType;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  remark?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  requestKey?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}
