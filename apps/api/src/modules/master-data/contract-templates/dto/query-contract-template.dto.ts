import { IsIn, IsOptional } from 'class-validator';
import { BaseQueryDto } from '../../../../common/dto/base-query.dto';
import { ContractTemplateStatus } from '@infitek/shared';

export class QueryContractTemplateDto extends BaseQueryDto {
  @IsOptional()
  @IsIn(Object.values(ContractTemplateStatus))
  status?: ContractTemplateStatus;
}
