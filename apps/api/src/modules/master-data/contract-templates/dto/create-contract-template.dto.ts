import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, Max } from 'class-validator';
import { ContractTemplateStatus } from '@infitek/shared';

export class CreateContractTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  templateFileKey?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  templateFileName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  isDefault?: number;

  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  requiresLegalReview?: number;

  @IsOptional()
  @IsIn(Object.values(ContractTemplateStatus))
  status?: ContractTemplateStatus;
}
