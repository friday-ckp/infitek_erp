import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { ExchangeDingtalkTicketDto } from './dto/exchange-dingtalk-ticket.dto';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录', description: '使用用户名和密码登录，返回 JWT Access Token。限制：60 秒内最多 5 次尝试' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('dingtalk/login')
  @ApiOperation({ summary: '钉钉登录入口', description: '生成一次性 state 并 302 跳转到钉钉授权页' })
  dingtalkLogin(@Res() response: Response) {
    const redirectUrl = this.authService.getDingtalkLoginRedirectUrl();
    response.redirect(HttpStatus.FOUND, redirectUrl);
  }

  @Public()
  @Get('dingtalk/callback')
  @ApiOperation({ summary: '钉钉登录回调', description: '处理钉钉 OAuth 回调并重定向到前端 callback 页面' })
  async dingtalkCallback(
    @Query('code') code: string | undefined,
    @Query('authCode') authCode: string | undefined,
    @Query('state') state: string | undefined,
    @Res() response: Response,
  ) {
    const redirectUrl = await this.authService.handleDingtalkCallback(authCode ?? code, state);
    response.redirect(HttpStatus.FOUND, redirectUrl);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('dingtalk/exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '交换钉钉登录 ticket', description: '使用一次性 ticket 交换正式 JWT 和最小用户信息' })
  exchangeDingtalkTicket(@Body() dto: ExchangeDingtalkTicketDto) {
    return this.authService.exchangeDingtalkTicket(dto.ticket);
  }
}
