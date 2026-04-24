import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SupplierInvoiceType, SupplierStatus } from '@infitek/shared';
import { CreateSupplierPaymentTermDto } from './create-supplier-payment-term.dto';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  shortName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contactPerson?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactPhone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contactEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  countryId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  countryName?: string;

  @IsEnum(SupplierStatus)
  @IsOptional()
  status?: SupplierStatus;

  @IsEnum(SupplierInvoiceType)
  @IsOptional()
  invoiceType?: SupplierInvoiceType;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  supplierLevel?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  origin?: string;

  @IsInt()
  @IsOptional()
  annualRebateEnabled?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  contractFrameworkFile?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  contractTemplateName?: string;

  @IsString()
  @IsOptional()
  annualRebateNote?: string;

  @IsString()
  @IsOptional()
  contractTerms?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierPaymentTermDto)
  @IsOptional()
  paymentTerms?: CreateSupplierPaymentTermDto[];
}
