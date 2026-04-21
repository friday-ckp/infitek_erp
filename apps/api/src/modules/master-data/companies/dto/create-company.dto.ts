import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nameCn: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  signingLocation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  bankName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  bankAccount?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  swiftCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  defaultCurrencyCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  taxId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  customsCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  quarantineCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameEn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  abbreviation?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  countryId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  countryName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  addressCn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  addressEn?: string;

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
  @MaxLength(50)
  defaultCurrencyName?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  chiefAccountantId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  chiefAccountantName?: string;
}
