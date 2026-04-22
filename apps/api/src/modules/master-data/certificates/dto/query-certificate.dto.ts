import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { CertificateStatus } from '@infitek/shared';

export class QueryCertificateDto extends BaseQueryDto {
  @IsString()
  @IsOptional()
  certificateType?: string;

  @IsEnum(CertificateStatus)
  @IsOptional()
  status?: CertificateStatus;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  categoryId?: number;
}
