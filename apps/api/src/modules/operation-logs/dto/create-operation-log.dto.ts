import { IsArray, IsIn, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  OperationLogAction,
} from '../entities/operation-log.entity';

export class OperationLogChangeItemDto {
  @IsString()
  field: string;

  @IsOptional()
  @IsString()
  fieldLabel?: string;

  @IsOptional()
  oldValue?: unknown;

  @IsOptional()
  newValue?: unknown;
}

export class CreateOperationLogDto {
  @IsString()
  operator: string;

  @IsOptional()
  operatorId?: number | null;

  @IsIn(Object.values(OperationLogAction))
  action: (typeof OperationLogAction)[keyof typeof OperationLogAction];

  @IsString()
  resourceType: string;

  @IsOptional()
  @IsString()
  resourceId?: string | null;

  @IsString()
  resourcePath: string;

  @IsOptional()
  @IsObject()
  requestSummary?: Record<string, unknown> | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperationLogChangeItemDto)
  changeSummary?: OperationLogChangeItemDto[] | null;
}
