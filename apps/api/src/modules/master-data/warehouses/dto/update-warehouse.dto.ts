import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { WarehouseOwnership, WarehouseStatus, WarehouseType } from '@infitek/shared';

export class UpdateWarehouseDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @IsEnum(Object.values(WarehouseStatus))
  @IsOptional()
  status?: WarehouseStatus;

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
