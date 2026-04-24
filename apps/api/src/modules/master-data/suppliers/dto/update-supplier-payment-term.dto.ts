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

export class UpdateSupplierPaymentTermDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
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
  settlementDays?: number;

  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  monthlySettlementDate?: number;

  @IsEnum(SupplierSettlementDateType)
  @IsOptional()
  settlementDateType?: SupplierSettlementDateType;
}
