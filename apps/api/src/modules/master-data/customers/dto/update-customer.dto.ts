import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  customerCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  customerName?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  countryId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  countryName?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  salespersonId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  salespersonName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contactPerson?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactPhone?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  contactEmail?: string;

  @IsString()
  @IsOptional()
  billingRequirements?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;
}
