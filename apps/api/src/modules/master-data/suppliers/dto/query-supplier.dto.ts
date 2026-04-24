import { IsEnum, IsOptional } from 'class-validator';
import { SupplierStatus } from '@infitek/shared';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';

export class QuerySupplierDto extends BaseQueryDto {
  @IsEnum(SupplierStatus)
  @IsOptional()
  status?: SupplierStatus;
}
