import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SkuStatus } from '@infitek/shared';

export class CreateSkuDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  spuId: number;

  @IsInt()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  unitId?: number;

  // --- 产品基本 ---
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameCn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameEn?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  specification: string;

  @IsIn(Object.values(SkuStatus))
  @IsOptional()
  status?: SkuStatus;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  productType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  principle?: string;

  @IsString()
  @IsOptional()
  productUsage?: string;

  @IsString()
  @IsOptional()
  coreParams?: string;

  @IsString()
  @IsOptional()
  electricalParams?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  material?: string;

  @IsBoolean()
  @IsOptional()
  hasPlug?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  specialAttributes?: string;

  @IsString()
  @IsOptional()
  specialAttributesNote?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  customerWarrantyMonths?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  forbiddenCountries?: string;

  // --- 重量体积 ---
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  weightKg: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  grossWeightKg?: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  lengthCm?: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  widthCm?: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  heightCm?: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  volumeCbm: number;

  // --- 包装 ---
  @IsString()
  @IsOptional()
  @MaxLength(100)
  packagingType?: string;

  @IsInt()
  @IsOptional()
  @IsPositive()
  packagingQty?: number;

  @IsString()
  @IsOptional()
  packagingInfo?: string;

  // --- 报关 ---
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^\d{8,10}$/, { message: 'HS 码必须为 8-10 位数字' })
  hsCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  customsNameCn: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  customsNameEn: string;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  declaredValueRef?: number;

  @IsString()
  @IsOptional()
  declarationElements?: string;

  @IsBoolean()
  @IsOptional()
  isInspectionRequired?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  regulatoryConditions?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  taxRefundRate?: number;

  @IsBoolean()
  @IsOptional()
  customsInfoMaintained?: boolean;

  // --- 图片 ---
  @IsString()
  @IsOptional()
  @MaxLength(500)
  productImageUrl?: string;
}
