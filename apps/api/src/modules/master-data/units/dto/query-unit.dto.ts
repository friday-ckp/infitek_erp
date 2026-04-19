import { IsEnum, IsOptional } from 'class-validator';
import { UnitStatus } from '@infitek/shared';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class QueryUnitDto extends BaseQueryDto {
  @IsEnum(Object.values(UnitStatus))
  @IsOptional()
  status?: UnitStatus;
}
