import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateOpeningInventoryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  skuId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  warehouseId: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;

  @IsDateString()
  @IsOptional()
  receiptDate?: string;
}
