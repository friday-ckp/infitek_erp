import { IsOptional, IsString, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductDocumentDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  attributionType?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  spuId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  countryId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  pageSize?: number;
}
