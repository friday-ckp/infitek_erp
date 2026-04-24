import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PortType } from '@infitek/shared';

export class UpdatePortDto {
  @IsString()
  @IsOptional()
  @IsIn(Object.values(PortType))
  portType?: PortType;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  portCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameCn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameEn?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  countryId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  countryName?: string;
}
