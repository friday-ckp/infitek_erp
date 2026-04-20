import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class QueryProductCategoryDto extends BaseQueryDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  parentId?: number;
}
