import { IsNotEmpty, IsString, IsOptional, IsInt, IsPositive, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductDocumentType, ProductDocumentAttributionType } from '@infitek/shared';

export class CreateProductDocumentDto {
  @IsNotEmpty()
  @IsString()
  documentName: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(Object.values(ProductDocumentType))
  documentType: ProductDocumentType;

  @IsOptional()
  @IsString()
  content?: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(Object.values(ProductDocumentAttributionType))
  attributionType: ProductDocumentAttributionType;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  countryId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  categoryLevel1Id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  categoryLevel2Id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  categoryLevel3Id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  spuId?: number;

  @IsOptional()
  @IsString()
  fileKey?: string;

  @IsOptional()
  @IsString()
  fileName?: string;
}
