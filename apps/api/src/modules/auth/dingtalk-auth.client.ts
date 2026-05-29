import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  constructor(private readonly configService: ConfigService) {}

  buildAuthorizationUrl(state: string): string {
    const config = this.getConfigOrThrow();
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'openid',
      state,
      prompt: 'consent',
    });

    return `${DINGTALK_AUTH_BASE_URL}?${params.toString()}`;
  }

  async exchangeCodeForIdentity(code: string): Promise<DingtalkIdentity> {
    const config = this.getConfigOrThrow();
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
      throw new UnauthorizedException({ code: 'DINGTALK_OAUTH_FAILED', message: '钉钉登录失败' });
    }

    const profile = await this.fetchJson<DingtalkProfileResponse>(DINGTALK_PROFILE_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const unionId = profile.unionId ?? profile.unionid;
    if (!unionId) {
      throw new UnauthorizedException({ code: 'DINGTALK_OAUTH_FAILED', message: '钉钉登录失败' });
    }

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
    } catch {
      throw new UnauthorizedException({ code: 'DINGTALK_OAUTH_FAILED', message: '钉钉登录失败' });
    }

    if (!response.ok) {
      throw new UnauthorizedException({ code: 'DINGTALK_OAUTH_FAILED', message: '钉钉登录失败' });
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new UnauthorizedException({ code: 'DINGTALK_OAUTH_FAILED', message: '钉钉登录失败' });
    }
  }
}
