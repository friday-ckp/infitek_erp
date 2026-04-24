import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateContractTemplateDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  templateFileKey?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  templateFileName?: string | null;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  content?: string;

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
}
