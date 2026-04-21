import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCountryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  code: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  nameEn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  abbreviation?: string;
}
