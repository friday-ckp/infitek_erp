import { IsString, IsOptional, IsInt, IsPositive, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductDocumentType, ProductDocumentAttributionType } from '@infitek/shared';

export class UpdateProductDocumentDto {
  @IsOptional()
  @IsString()
  documentName?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(ProductDocumentType))
  documentType?: ProductDocumentType;

  @IsOptional()
  @IsString()
  content?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(ProductDocumentAttributionType))
  attributionType?: ProductDocumentAttributionType;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  countryId?: number | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  categoryLevel1Id?: number | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  categoryLevel2Id?: number | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  categoryLevel3Id?: number | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  spuId?: number | null;

  @IsOptional()
  @IsString()
  fileKey?: string | null;

  @IsOptional()
  @IsString()
  fileName?: string | null;
}
