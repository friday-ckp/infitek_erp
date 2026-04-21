import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { CurrencyStatus } from '@infitek/shared';

export class UpdateCurrencyDto {
  @IsString()
  @IsOptional()
  @MaxLength(10)
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @IsEnum(Object.values(CurrencyStatus))
  @IsOptional()
  status?: CurrencyStatus;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  symbol?: string;

  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  isBaseCurrency?: number;
}
