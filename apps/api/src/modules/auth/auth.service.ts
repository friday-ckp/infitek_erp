import { Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { appendFileSync } from 'node:fs';
import { UsersService } from '../users/users.service';
import { UserStatus } from '@infitek/shared';
import { DingtalkAuthClient } from './dingtalk-auth.client';
import { DingtalkLoginSessionStore } from './dingtalk-login-session.store';
import type { DingtalkConfig } from '../../config/dingtalk.config';
import { DingtalkOrgUsersService } from '../dingtalk-org-users/dingtalk-org-users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly debugLogPath = '/Users/chenkangping/ai_study/infitek_erp/_bmad-output/implementation-artifacts/tests/dingtalk-oauth-debug.log';

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dingtalkAuthClient: DingtalkAuthClient,
    private readonly dingtalkLoginSessionStore: DingtalkLoginSessionStore,
    private readonly dingtalkOrgUsersService: DingtalkOrgUsersService,
  ) {}

  async login(username: string, password: string): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByUsername(username);

    // 用户不存在或密码错误：统一返回相同错误，防止用户枚举攻击
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' });
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException({ code: 'ACCOUNT_DISABLED', message: '账号已停用' });
    }

    const payload = { sub: user.id, username: user.username };
    return { accessToken: this.jwtService.sign(payload) };
  }

  getDingtalkLoginRedirectUrl(): string {
    const state = this.dingtalkLoginSessionStore.createState();
    return this.dingtalkAuthClient.buildAuthorizationUrl(state);
  }

  async handleDingtalkCallback(code: string | undefined, state: string | undefined): Promise<string> {
    const frontendCallbackUri = this.extractFrontendCallbackUri();
    this.logger.log(
      `Handling DingTalk callback; hasCode=${Boolean(code)}; codeLength=${code?.length ?? 0}; hasState=${Boolean(state)}`,
    );
    this.debugLog(
      `Handling DingTalk callback; hasCode=${Boolean(code)}; codeLength=${code?.length ?? 0}; hasState=${Boolean(state)}`,
    );

    try {
      if (!state) {
        throw new UnauthorizedException({ code: 'DINGTALK_STATE_INVALID', message: '钉钉登录状态无效或已过期' });
      }

      this.dingtalkLoginSessionStore.consumeState(state);

      if (!code) {
        throw new UnauthorizedException({ code: 'DINGTALK_OAUTH_FAILED', message: '钉钉登录失败' });
      }

      const identity = await this.dingtalkAuthClient.exchangeCodeForIdentity(code);
      let user = await this.usersService.findByDingtalkUnionId(identity.unionId);

      if (!user) {
        user = await this.dingtalkOrgUsersService.autoBindForLogin(identity);
      }

      if (!user) {
        this.logger.warn(
          `DingTalk account is unbound: unionId=${identity.unionId}; userId=${identity.userId ?? ''}; openId=${identity.openId ?? ''}; nick=${identity.nick ?? ''}`,
        );
        return this.buildFrontendCallbackUrl(frontendCallbackUri, {
          error: 'DINGTALK_ACCOUNT_UNBOUND',
          debugUnionId: identity.unionId,
          ...(identity.nick ? { debugNick: identity.nick } : {}),
        });
      }

      if (user.status === UserStatus.INACTIVE) {
        throw new UnauthorizedException({ code: 'DINGTALK_ACCOUNT_DISABLED', message: '账号已停用' });
      }

      const loginTicket = this.dingtalkLoginSessionStore.createLoginTicket({
        userId: user.id,
        username: user.username,
      });

      return this.buildFrontendCallbackUrl(frontendCallbackUri, { ticket: loginTicket });
    } catch (error) {
      const errorCode = this.extractErrorCode(error);
      this.debugLog(`DingTalk callback failed; errorCode=${errorCode}`);
      return this.buildFrontendCallbackUrl(frontendCallbackUri, { error: errorCode });
    }
  }

  async exchangeDingtalkTicket(ticket: string): Promise<{ accessToken: string; user: { id: number; username: string; name: string } }> {
    const payload = this.dingtalkLoginSessionStore.consumeLoginTicket(ticket);
    const user = await this.usersService.findById(payload.userId);

    if (!user) {
      throw new UnauthorizedException({ code: 'DINGTALK_TICKET_INVALID', message: '登录 ticket 无效' });
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException({ code: 'DINGTALK_ACCOUNT_DISABLED', message: '账号已停用' });
    }

    return {
      accessToken: this.jwtService.sign({ sub: user.id, username: user.username }),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
      },
    };
  }

  private extractFrontendCallbackUri(): string {
    const config = this.configService.get<DingtalkConfig>('dingtalk');

    if (!config?.frontendCallbackUri) {
      throw new InternalServerErrorException({ code: 'DINGTALK_CONFIG_MISSING', message: '钉钉登录配置缺失' });
    }

    return config.frontendCallbackUri;
  }

  private buildFrontendCallbackUrl(baseUrl: string, params: Record<string, string>): string {
    const url = new URL(baseUrl);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    return url.toString();
  }

  private extractErrorCode(error: unknown): string {
    if (error instanceof InternalServerErrorException) {
      throw error;
    }

    if (error instanceof UnauthorizedException) {
      const response = error.getResponse() as { code?: string };
      return response.code ?? 'DINGTALK_OAUTH_FAILED';
    }

    return 'DINGTALK_OAUTH_FAILED';
  }

  private debugLog(message: string) {
    try {
      appendFileSync(this.debugLogPath, `[${new Date().toISOString()}] ${message}\n`);
    } catch {
      // ignore file logging failures
    }
  }
}
