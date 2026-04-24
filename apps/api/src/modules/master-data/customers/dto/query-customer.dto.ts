import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class QueryCustomerDto extends BaseQueryDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  countryId?: number;
}
