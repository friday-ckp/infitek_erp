import { IsString, IsOptional, MinLength, MaxLength, IsEnum } from 'class-validator';
import { UserStatus } from '@infitek/shared';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
