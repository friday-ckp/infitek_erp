import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProductCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  nameEn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  purchaseOwner?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  productOwner?: string;
}
