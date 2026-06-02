import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { DingtalkOrgUserStatus } from '@infitek/shared';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export class QueryDingtalkOrgUsersDto extends BaseQueryDto {
  @Transform(({ value }) => normalizeOptionalString(value))
  override keyword: string | undefined = undefined;

  @Transform(({ value }) => normalizeOptionalString(value))
  @IsOptional()
  @IsIn(Object.values(DingtalkOrgUserStatus))
  status?: (typeof DingtalkOrgUserStatus)[keyof typeof DingtalkOrgUserStatus];
}
