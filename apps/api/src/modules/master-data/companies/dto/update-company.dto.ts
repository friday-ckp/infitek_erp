import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

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
}
