import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class BindDingtalkDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  dingtalkUnionId: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  dingtalkUserId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  dingtalkOpenId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  dingtalkNick?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  dingtalkAvatar?: string;
}
