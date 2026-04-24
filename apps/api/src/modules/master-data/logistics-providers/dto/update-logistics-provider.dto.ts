import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LogisticsProviderStatus } from '@infitek/shared';

export class UpdateLogisticsProviderDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  providerCode?: string;

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

  @IsEmail()
  @IsOptional()
  @MaxLength(200)
  contactEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

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
  countryId?: number | null;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  countryName?: string | null;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  defaultCompanyId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  defaultCompanyName?: string | null;

  @IsOptional()
  serviceTypes?: never;
}
