import { Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { appendFileSync } from 'node:fs';
import type { DingtalkConfig } from '../../config/dingtalk.config';

const DINGTALK_AUTH_BASE_URL = 'https://login.dingtalk.com/oauth2/auth';
const DINGTALK_ACCESS_TOKEN_URL = 'https://api.dingtalk.com/v1.0/oauth2/userAccessToken';
const DINGTALK_PROFILE_URL = 'https://api.dingtalk.com/v1.0/contact/users/me';

interface DingtalkAccessTokenResponse {
  accessToken?: string;
  access_token?: string;
}

interface DingtalkProfileResponse {
  unionId?: string;
  unionid?: string;
  userId?: string;
  userid?: string;
  openId?: string;
  openid?: string;
  nick?: string;
  avatarUrl?: string;
  avatar?: string;
}

export interface DingtalkIdentity {
  unionId: string;
  userId: string | null;
  openId: string | null;
  nick: string | null;
  avatar: string | null;
}

@Injectable()
export class DingtalkAuthClient {
  private readonly logger = new Logger(DingtalkAuthClient.name);
  private readonly debugLogPath = '/Users/chenkangping/ai_study/infitek_erp/_bmad-output/implementation-artifacts/tests/dingtalk-oauth-debug.log';

  constructor(private readonly configService: ConfigService) {}

  buildAuthorizationUrl(state: string): string {
    const config = this.getConfigOrThrow();
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'openid corpid',
      state,
      prompt: 'consent',
    });

    return `${DINGTALK_AUTH_BASE_URL}?${params.toString()}`;
  }

  async exchangeCodeForIdentity(code: string): Promise<DingtalkIdentity> {
    const config = this.getConfigOrThrow();
    this.logger.log(`Starting DingTalk code exchange; codeLength=${code.length}`);
    this.debugLog(`Starting DingTalk code exchange; codeLength=${code.length}`);
    const accessTokenResponse = await this.fetchJson<DingtalkAccessTokenResponse>(DINGTALK_ACCESS_TOKEN_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        code,
        grantType: 'authorization_code',
      }),
    });

    const accessToken = accessTokenResponse.accessToken ?? accessTokenResponse.access_token;
    if (!accessToken) {
      this.logger.error(
        `DingTalk access token response missing token fields; keys=${Object.keys(accessTokenResponse).join(',') || 'none'}`,
      );
      this.debugLog(
        `DingTalk access token response missing token fields; keys=${Object.keys(accessTokenResponse).join(',') || 'none'}`,
      );
      throw new UnauthorizedException({ code: 'DINGTALK_OAUTH_FAILED', message: '钉钉登录失败' });
    }

    const profile = await this.fetchJson<DingtalkProfileResponse>(DINGTALK_PROFILE_URL, {
      method: 'GET',
      headers: {
        'x-acs-dingtalk-access-token': accessToken,
      },
    });

    const unionId = profile.unionId ?? profile.unionid;
    if (!unionId) {
      this.logger.error(
        `DingTalk profile response missing unionId; keys=${Object.keys(profile).join(',') || 'none'}; userId=${profile.userId ?? profile.userid ?? ''}; openId=${profile.openId ?? profile.openid ?? ''}`,
      );
      this.debugLog(
        `DingTalk profile response missing unionId; keys=${Object.keys(profile).join(',') || 'none'}; userId=${profile.userId ?? profile.userid ?? ''}; openId=${profile.openId ?? profile.openid ?? ''}`,
      );
      throw new UnauthorizedException({ code: 'DINGTALK_OAUTH_FAILED', message: '钉钉登录失败' });
    }

    this.logger.log(
      `DingTalk profile exchange succeeded; unionIdPresent=true; userId=${profile.userId ?? profile.userid ?? ''}; openId=${profile.openId ?? profile.openid ?? ''}`,
    );
    this.debugLog(
      `DingTalk profile exchange succeeded; unionIdPresent=true; userId=${profile.userId ?? profile.userid ?? ''}; openId=${profile.openId ?? profile.openid ?? ''}`,
    );

    return {
      unionId,
      userId: profile.userId ?? profile.userid ?? null,
      openId: profile.openId ?? profile.openid ?? null,
      nick: profile.nick ?? null,
      avatar: profile.avatarUrl ?? profile.avatar ?? null,
    };
  }

  private getConfigOrThrow(): DingtalkConfig {
    const config = this.configService.get<DingtalkConfig>('dingtalk');

    if (
      !config?.clientId ||
      !config.clientSecret ||
      !config.redirectUri ||
      !config.frontendCallbackUri
    ) {
      throw new InternalServerErrorException({
        code: 'DINGTALK_CONFIG_MISSING',
        message: '钉钉登录配置缺失',
      });
    }

    return config;
  }

  private async fetchJson<T>(url: string, init: RequestInit): Promise<T> {
    let response: Response;

    try {
      response = await fetch(url, init);
    } catch (error) {
      this.logger.error(
        `DingTalk request failed before response: ${url}`,
        error instanceof Error ? error.stack : String(error),
      );
      this.debugLog(`DingTalk request failed before response: ${url}; error=${error instanceof Error ? error.message : String(error)}`);
      throw new UnauthorizedException({ code: 'DINGTALK_OAUTH_FAILED', message: '钉钉登录失败' });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      this.logger.error(
        `DingTalk request returned non-OK status: ${url} -> ${response.status} ${response.statusText}; body=${errorText}`,
      );
      this.debugLog(
        `DingTalk request returned non-OK status: ${url} -> ${response.status} ${response.statusText}; body=${errorText}`,
      );
      throw new UnauthorizedException({ code: 'DINGTALK_OAUTH_FAILED', message: '钉钉登录失败' });
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      this.logger.error(
        `DingTalk response JSON parse failed: ${url}`,
        error instanceof Error ? error.stack : String(error),
      );
      this.debugLog(`DingTalk response JSON parse failed: ${url}; error=${error instanceof Error ? error.message : String(error)}`);
      throw new UnauthorizedException({ code: 'DINGTALK_OAUTH_FAILED', message: '钉钉登录失败' });
    }
  }

  private debugLog(message: string) {
    try {
      appendFileSync(this.debugLogPath, `[${new Date().toISOString()}] ${message}\n`);
    } catch {
      // ignore file logging failures
    }
  }
}
