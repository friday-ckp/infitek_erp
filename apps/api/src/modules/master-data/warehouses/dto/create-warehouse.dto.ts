import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { WarehouseOwnership, WarehouseType } from '@infitek/shared';

export class CreateWarehouseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  warehouseCode?: string;

  @IsEnum(Object.values(WarehouseType))
  @IsOptional()
  warehouseType?: WarehouseType;

  @IsNumber()
  @IsOptional()
  supplierId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  supplierName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  defaultShipProvince?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  defaultShipCity?: string;

  @IsEnum(Object.values(WarehouseOwnership))
  @IsOptional()
  ownership?: WarehouseOwnership;

  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  isVirtual?: number;
}
