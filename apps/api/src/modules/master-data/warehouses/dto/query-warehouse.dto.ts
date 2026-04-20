import { IsEnum, IsOptional } from 'class-validator';
import { WarehouseStatus } from '@infitek/shared';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class QueryWarehouseDto extends BaseQueryDto {
  @IsEnum(Object.values(WarehouseStatus))
  @IsOptional()
  status?: WarehouseStatus;
}
