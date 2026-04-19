import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { UnitStatus } from '@infitek/shared';

export class UpdateUnitDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsEnum(Object.values(UnitStatus))
  @IsOptional()
  status?: UnitStatus;
}
