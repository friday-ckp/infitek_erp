import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class QueryPortDto extends BaseQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  countryId?: number;
}
