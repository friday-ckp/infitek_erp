import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { SpuFaqQuestionType } from '@infitek/shared';

export class QuerySpuFaqDto extends BaseQueryDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  spuId?: number;

  @IsEnum(SpuFaqQuestionType)
  @IsOptional()
  questionType?: SpuFaqQuestionType;

  @IsString()
  @IsOptional()
  spuCode?: string;
}
