import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSpuFaqDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  spuId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
