import { IsEnum, IsOptional } from 'class-validator';
import { CurrencyStatus } from '@infitek/shared';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class QueryCurrencyDto extends BaseQueryDto {
  @IsEnum(Object.values(CurrencyStatus))
  @IsOptional()
  status?: CurrencyStatus;
}
