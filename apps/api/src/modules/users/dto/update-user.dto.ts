import { IsString, IsOptional, MinLength, MaxLength, IsEnum, IsEmail, Matches } from 'class-validator';
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

  @IsString()
  @IsOptional()
  @MaxLength(32)
  @Matches(/^[0-9+\-()\s]*$/, { message: '手机号格式不正确' })
  mobile?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  jobNumber?: string;
}
