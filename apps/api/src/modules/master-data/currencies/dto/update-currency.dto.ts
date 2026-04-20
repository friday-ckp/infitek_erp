import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
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
}
