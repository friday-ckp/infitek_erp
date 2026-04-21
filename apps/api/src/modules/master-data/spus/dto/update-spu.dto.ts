import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSpuDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsInt()
  @IsOptional()
  @IsPositive()
  categoryId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  unit?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  manufacturerModel?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  customerWarrantyMonths?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  purchaseWarrantyMonths?: number;

  @IsString()
  @IsOptional()
  supplierWarrantyNote?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  forbiddenCountries?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  invoiceName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  invoiceUnit?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  invoiceModel?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  supplierName?: string;

  @IsInt()
  @IsOptional()
  @IsPositive()
  companyId?: number;
}
