import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import {
  SupplierSettlementDateType,
  SupplierSettlementType,
} from '@infitek/shared';
import { Type } from 'class-transformer';

export class UpdateSupplierPaymentTermDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  companyId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  companyName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  paymentTermName?: string;

  @IsEnum(SupplierSettlementType)
  @IsOptional()
  settlementType?: SupplierSettlementType;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  settlementDays?: number;

  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  @Type(() => Number)
  monthlySettlementDate?: number;

  @IsEnum(SupplierSettlementDateType)
  @IsOptional()
  settlementDateType?: SupplierSettlementDateType;
}
