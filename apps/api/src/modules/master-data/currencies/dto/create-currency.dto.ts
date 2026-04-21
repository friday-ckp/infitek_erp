import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateCurrencyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

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
