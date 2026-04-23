import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SpuFaqQuestionType } from '@infitek/shared';

export class CreateSpuFaqDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  spuId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  spuCode?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsEnum(SpuFaqQuestionType)
  @IsNotEmpty()
  questionType: SpuFaqQuestionType;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  attachmentUrl?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
