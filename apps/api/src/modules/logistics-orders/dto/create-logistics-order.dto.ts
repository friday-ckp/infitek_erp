import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { TransportationMethod, YesNo } from '@infitek/shared';

export class CreateLogisticsOrderItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  shippingDemandItemId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  plannedQuantity: number;
}

export class CreateLogisticsOrderPackageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  packageNo: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantityPerBox: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  boxCount: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalQuantity: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  lengthCm?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  widthCm?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  heightCm?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  grossWeightKg?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  remarks?: string;
}

export class CreateLogisticsOrderDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  shippingDemandId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  logisticsProviderId: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  logisticsProviderName?: string;

  @IsString()
  @IsIn(Object.values(TransportationMethod))
  transportationMethod: TransportationMethod;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  companyId: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  companyName?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  originPortId?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  originPortName: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  destinationPortId?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  destinationPortName: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  destinationCountryId?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  destinationCountryName: string;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(YesNo))
  requiresExportCustoms?: YesNo;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLogisticsOrderItemDto)
  items: CreateLogisticsOrderItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLogisticsOrderPackageDto)
  packages: CreateLogisticsOrderPackageDto[];
}
