import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { WarehouseStatus } from '@infitek/shared';

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
}
