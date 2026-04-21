import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCountryDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  nameEn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  abbreviation?: string;
}
