import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { OperationLogAction } from '../entities/operation-log.entity';

export class QueryOperationLogDto extends BaseQueryDto {
  @IsString()
  @IsOptional()
  operator?: string;

  @IsIn(Object.values(OperationLogAction))
  @IsOptional()
  action?: (typeof OperationLogAction)[keyof typeof OperationLogAction];

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsString()
  @IsOptional()
  resourceType?: string;

  @Type(() => String)
  @IsString()
  @IsOptional()
  resourceId?: string;
}
