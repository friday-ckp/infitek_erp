import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PortType } from '@infitek/shared';

export class CreatePortDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(PortType))
  portType: PortType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  portCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nameCn: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nameEn: string;

  @Type(() => Number)
  @IsNumber()
  countryId: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  countryName?: string;
}
