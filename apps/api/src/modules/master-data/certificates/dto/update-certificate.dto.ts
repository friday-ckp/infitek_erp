import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateCertificateDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  certificateName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  certificateType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  directive?: string;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  issuingAuthority?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  attributionType?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  categoryId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  fileKey?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  fileName?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayUnique()
  @IsOptional()
  spuIds?: number[];
}
