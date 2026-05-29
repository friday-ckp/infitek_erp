import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DingtalkAuthClient } from '../dingtalk-auth.client';

describe('DingtalkAuthClient', () => {
  let client: DingtalkAuthClient;
  let configService: jest.Mocked<ConfigService>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue({
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'https://api.example.com/api/auth/dingtalk/callback',
        frontendCallbackUri: 'https://web.example.com/login/dingtalk/callback',
      }),
    } as unknown as jest.Mocked<ConfigService>;

    client = new DingtalkAuthClient(configService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('应生成带 state 的授权地址', () => {
    const url = new URL(client.buildAuthorizationUrl('state-1'));

    expect(url.origin + url.pathname).toBe('https://login.dingtalk.com/oauth2/auth');
    expect(url.searchParams.get('client_id')).toBe('client-id');
    expect(url.searchParams.get('redirect_uri')).toBe('https://api.example.com/api/auth/dingtalk/callback');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toBe('openid');
    expect(url.searchParams.get('state')).toBe('state-1');
  });

  it('应完成 code -> accessToken -> identity 映射', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accessToken: 'access-token-1' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          unionid: 'union-1',
          userid: 'user-1',
          openid: 'open-1',
          nick: '张三',
          avatarUrl: 'https://example.com/avatar.png',
        }),
      } as Response);

    await expect(client.exchangeCodeForIdentity('oauth-code')).resolves.toEqual({
      unionId: 'union-1',
      userId: 'user-1',
      openId: 'open-1',
      nick: '张三',
      avatar: 'https://example.com/avatar.png',
    });

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.dingtalk.com/v1.0/oauth2/userAccessToken',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.dingtalk.com/v1.0/contact/users/me',
      expect.objectContaining({
        method: 'GET',
        headers: {
          Authorization: 'Bearer access-token-1',
        },
      }),
    );
  });

  it('钉钉 access token 缺失时应抛出 DINGTALK_OAUTH_FAILED', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    await expect(client.exchangeCodeForIdentity('oauth-code')).rejects.toThrow(
      expect.objectContaining({
        response: {
          code: 'DINGTALK_OAUTH_FAILED',
          message: '钉钉登录失败',
        },
      }),
    );
  });

  it('钉钉 profile 缺少 unionId 时应抛出 DINGTALK_OAUTH_FAILED', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'access-token-1' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ userid: 'user-1' }),
      } as Response);

    await expect(client.exchangeCodeForIdentity('oauth-code')).rejects.toThrow(
      expect.objectContaining({
        response: {
          code: 'DINGTALK_OAUTH_FAILED',
          message: '钉钉登录失败',
        },
      }),
    );
  });

  it('配置缺失时应抛出 DINGTALK_CONFIG_MISSING', () => {
    configService.get.mockReturnValueOnce({
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      frontendCallbackUri: '',
    });

    try {
      client.buildAuthorizationUrl('state-1');
      fail('expected buildAuthorizationUrl to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(InternalServerErrorException);
      expect((error as InternalServerErrorException).getResponse()).toMatchObject({
        code: 'DINGTALK_CONFIG_MISSING',
        message: '钉钉登录配置缺失',
      });
    }
  });
});
