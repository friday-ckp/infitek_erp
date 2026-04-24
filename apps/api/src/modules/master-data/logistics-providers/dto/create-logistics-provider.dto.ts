import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LogisticsProviderStatus } from '@infitek/shared';

export class CreateLogisticsProviderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  providerCode?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  shortName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contactPerson: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  contactPhone: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(200)
  contactEmail: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(LogisticsProviderStatus))
  status?: LogisticsProviderStatus;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  providerLevel?: number;

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
  defaultCompanyId: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  defaultCompanyName?: string;

  @IsOptional()
  serviceTypes?: never;
}
