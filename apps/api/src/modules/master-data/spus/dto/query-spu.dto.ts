import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class QuerySpuDto extends BaseQueryDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  categoryId?: number;
}
