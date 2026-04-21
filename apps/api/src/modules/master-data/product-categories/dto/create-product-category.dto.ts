import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateProductCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  nameEn?: string;

  @IsInt()
  @IsOptional()
  @IsPositive()
  parentId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  purchaseOwner?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  productOwner?: string;
}
