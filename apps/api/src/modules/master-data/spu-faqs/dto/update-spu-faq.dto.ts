import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { SpuFaqQuestionType } from '@infitek/shared';

export class UpdateSpuFaqDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  question?: string;

  @IsString()
  @IsOptional()
  answer?: string;

  @IsEnum(SpuFaqQuestionType)
  @IsOptional()
  questionType?: SpuFaqQuestionType;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  attachmentUrl?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
