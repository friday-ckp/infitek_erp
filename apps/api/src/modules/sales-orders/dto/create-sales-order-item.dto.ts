import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PlugType, ProductLineType, YesNo } from '@infitek/shared';

export class CreateSalesOrderItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @Type(() => Number)
  @IsNumber()
  skuId: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  productNameCn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  productNameEn?: string;

  @IsOptional()
  @IsIn(Object.values(ProductLineType))
  lineType?: ProductLineType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  spuId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  spuName?: string;

  @IsOptional()
  @IsString()
  electricalParams?: string;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  hasPlug?: YesNo;

  @IsOptional()
  @IsIn(Object.values(PlugType))
  plugType?: PlugType;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  currencyId?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  purchaserId?: number;

  @IsOptional()
  @IsIn(Object.values(YesNo))
  needsPurchase?: YesNo;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchaseQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  useStockQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  preparedQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  shippedQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unitId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unitName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  material?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  totalVolumeCbm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  totalWeightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unitWeightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unitVolumeCbm?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  skuSpecification?: string;
}
