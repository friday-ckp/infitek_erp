import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCertificateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  certificateName: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  certificateNo?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  certificateType: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  directive?: string;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsNotEmpty()
  validFrom: string;

  @IsDateString()
  @IsNotEmpty()
  validUntil: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  issuingAuthority: string;

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
