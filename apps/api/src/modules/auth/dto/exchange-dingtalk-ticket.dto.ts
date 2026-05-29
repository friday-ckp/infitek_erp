import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ExchangeDingtalkTicketDto {
  @ApiProperty({ example: 'b2a9f7b50b8a4d2d8e7cc1fa4b8e1d44', description: '一次性钉钉登录 ticket' })
  @IsString()
  @IsNotEmpty({ message: 'ticket 不能为空' })
  @MaxLength(256, { message: 'ticket 长度不能超过 256 个字符' })
  ticket: string;
}
