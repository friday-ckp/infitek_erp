import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';
import { UserStatus } from '@infitek/shared';
import { DingtalkAuthClient } from '../dingtalk-auth.client';
import { DingtalkLoginSessionStore } from '../dingtalk-login-session.store';
import { DingtalkOrgUsersService } from '../../dingtalk-org-users/dingtalk-org-users.service';

// mock bcrypt 整个模块，避免 native addon 不可重定义问题
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

const mockUser: User = {
  id: 1,
  username: 'admin',
  name: '系统管理员',
  password: '$2b$12$hashedpassword',
  status: UserStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'system',
  updatedBy: null,
  deletedAt: null,
  dingtalkUnionId: null,
  dingtalkUserId: null,
  dingtalkOpenId: null,
  dingtalkNick: null,
  dingtalkAvatar: null,
  dingtalkBoundAt: null,
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let dingtalkAuthClient: jest.Mocked<DingtalkAuthClient>;
  let dingtalkLoginSessionStore: jest.Mocked<DingtalkLoginSessionStore>;
  let dingtalkOrgUsersService: jest.Mocked<DingtalkOrgUsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { findByUsername: jest.fn(), findByDingtalkUnionId: jest.fn(), findById: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock.jwt.token') },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'dingtalk') {
                return {
                  clientId: 'client-id',
                  clientSecret: 'client-secret',
                  redirectUri: 'https://api.example.com/api/auth/dingtalk/callback',
                  frontendCallbackUri: 'https://web.example.com/login/dingtalk/callback',
                };
              }

              return undefined;
            }),
          },
        },
        {
          provide: DingtalkAuthClient,
          useValue: {
            buildAuthorizationUrl: jest.fn(),
            exchangeCodeForIdentity: jest.fn(),
          },
        },
        {
          provide: DingtalkLoginSessionStore,
          useValue: {
            createState: jest.fn(),
            consumeState: jest.fn(),
            createLoginTicket: jest.fn(),
            consumeLoginTicket: jest.fn(),
          },
        },
        {
          provide: DingtalkOrgUsersService,
          useValue: {
            autoBindForLogin: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    dingtalkAuthClient = module.get(DingtalkAuthClient);
    dingtalkLoginSessionStore = module.get(DingtalkLoginSessionStore);
    dingtalkOrgUsersService = module.get(DingtalkOrgUsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('应返回 accessToken（登录成功）', async () => {
      usersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('admin', 'Admin@123');

      expect(result).toEqual({ accessToken: 'mock.jwt.token' });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 1, username: 'admin' });
    });

    it('用户不存在时应抛出 INVALID_CREDENTIALS', async () => {
      usersService.findByUsername.mockResolvedValue(null);

      await expect(service.login('unknown', 'password')).rejects.toThrow(
        expect.objectContaining({ response: { code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' } }),
      );
    });

    it('密码错误时应抛出 INVALID_CREDENTIALS', async () => {
      usersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('admin', 'wrongpassword')).rejects.toThrow(
        expect.objectContaining({ response: { code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' } }),
      );
    });

    it('账号停用时应抛出 ACCOUNT_DISABLED', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE };
      usersService.findByUsername.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login('admin', 'Admin@123')).rejects.toThrow(
        expect.objectContaining({ response: { code: 'ACCOUNT_DISABLED', message: '账号已停用' } }),
      );
    });

    it('已绑定钉钉的用户仍可通过密码登录', async () => {
      const boundUser = {
        ...mockUser,
        dingtalkUnionId: 'union_abc123',
        dingtalkUserId: 'user_xyz789',
        dingtalkOpenId: 'open_def456',
        dingtalkNick: 'Zhang San',
        dingtalkAvatar: 'https://example.com/avatar.png',
        dingtalkBoundAt: new Date('2024-06-01T10:00:00Z'),
      };
      usersService.findByUsername.mockResolvedValue(boundUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('admin', 'Admin@123');

      expect(result).toEqual({ accessToken: 'mock.jwt.token' });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 1, username: 'admin' });
    });
  });

  describe('getDingtalkLoginRedirectUrl', () => {
    it('应生成 state 并返回授权地址', () => {
      dingtalkLoginSessionStore.createState.mockReturnValue('state-1');
      dingtalkAuthClient.buildAuthorizationUrl.mockReturnValueOnce('https://login.dingtalk.com/oauth2/auth?state=state-1');

      const result = service.getDingtalkLoginRedirectUrl();

      expect(dingtalkLoginSessionStore.createState).toHaveBeenCalled();
      expect(dingtalkAuthClient.buildAuthorizationUrl).toHaveBeenCalledWith('state-1');
      expect(result).toBe('https://login.dingtalk.com/oauth2/auth?state=state-1');
    });
  });

  describe('handleDingtalkCallback', () => {
    it('已绑定且启用用户应重定向到带 ticket 的前端地址', async () => {
      dingtalkLoginSessionStore.consumeState.mockReturnValue();
      dingtalkAuthClient.exchangeCodeForIdentity.mockResolvedValue({
        unionId: 'union-1',
        userId: 'user-1',
        openId: 'open-1',
        nick: '张三',
        avatar: null,
      });
      usersService.findByDingtalkUnionId.mockResolvedValue(mockUser);
      dingtalkLoginSessionStore.createLoginTicket.mockReturnValue('ticket-1');

      const result = await service.handleDingtalkCallback('oauth-code', 'state-1');

      expect(dingtalkLoginSessionStore.consumeState).toHaveBeenCalledWith('state-1');
      expect(dingtalkAuthClient.exchangeCodeForIdentity).toHaveBeenCalledWith('oauth-code');
      expect(usersService.findByDingtalkUnionId).toHaveBeenCalledWith('union-1');
      expect(configService.get).toHaveBeenCalledWith('dingtalk');
      expect(result).toContain('ticket=ticket-1');
    });

    it('未绑定用户应跳转带 DINGTALK_ACCOUNT_UNBOUND 错误码', async () => {
      dingtalkLoginSessionStore.consumeState.mockReturnValue();
      dingtalkAuthClient.exchangeCodeForIdentity.mockResolvedValue({
        unionId: 'union-missing',
        userId: null,
        openId: null,
        nick: null,
        avatar: null,
      });
      usersService.findByDingtalkUnionId.mockResolvedValue(null);
      dingtalkOrgUsersService.autoBindForLogin.mockResolvedValue(null);

      const result = await service.handleDingtalkCallback('oauth-code', 'state-1');

      expect(result).toContain('error=DINGTALK_ACCOUNT_UNBOUND');
    });

    it('用户池存在唯一匹配时应自动绑定并返回 ticket', async () => {
      dingtalkLoginSessionStore.consumeState.mockReturnValue();
      dingtalkAuthClient.exchangeCodeForIdentity.mockResolvedValue({
        unionId: 'union-auto-bind',
        userId: 'dt-user-1',
        openId: 'open-1',
        nick: '张三',
        avatar: 'https://example.com/avatar.png',
      });
      usersService.findByDingtalkUnionId.mockResolvedValue(null);
      dingtalkOrgUsersService.autoBindForLogin.mockResolvedValue({
        ...mockUser,
        dingtalkUnionId: 'union-auto-bind',
      });
      dingtalkLoginSessionStore.createLoginTicket.mockReturnValue('ticket-auto-bind');

      const result = await service.handleDingtalkCallback('oauth-code', 'state-1');

      expect(dingtalkOrgUsersService.autoBindForLogin).toHaveBeenCalledWith({
        unionId: 'union-auto-bind',
        userId: 'dt-user-1',
        openId: 'open-1',
        nick: '张三',
        avatar: 'https://example.com/avatar.png',
      });
      expect(result).toContain('ticket=ticket-auto-bind');
    });

    it('停用账号应跳转带 DINGTALK_ACCOUNT_DISABLED 错误码', async () => {
      dingtalkLoginSessionStore.consumeState.mockReturnValue();
      dingtalkAuthClient.exchangeCodeForIdentity.mockResolvedValue({
        unionId: 'union-1',
        userId: 'user-1',
        openId: null,
        nick: null,
        avatar: null,
      });
      usersService.findByDingtalkUnionId.mockResolvedValue({ ...mockUser, status: UserStatus.INACTIVE });

      const result = await service.handleDingtalkCallback('oauth-code', 'state-1');

      expect(result).toContain('error=DINGTALK_ACCOUNT_DISABLED');
    });

    it('缺少 code 时应跳转带 DINGTALK_OAUTH_FAILED 错误码', async () => {
      const result = await service.handleDingtalkCallback(undefined, 'state-1');

      expect(result).toContain('error=DINGTALK_OAUTH_FAILED');
      expect(dingtalkLoginSessionStore.consumeState).toHaveBeenCalledWith('state-1');
      expect(dingtalkAuthClient.exchangeCodeForIdentity).not.toHaveBeenCalled();
    });

    it('缺少 state 时应跳转带 DINGTALK_STATE_INVALID 错误码', async () => {
      const result = await service.handleDingtalkCallback('oauth-code', undefined);

      expect(result).toContain('error=DINGTALK_STATE_INVALID');
      expect(dingtalkLoginSessionStore.consumeState).not.toHaveBeenCalled();
      expect(dingtalkAuthClient.exchangeCodeForIdentity).not.toHaveBeenCalled();
    });

    it('无效 state 应跳转带 DINGTALK_STATE_INVALID 错误码', async () => {
      dingtalkLoginSessionStore.consumeState.mockImplementation(() => {
        throw new UnauthorizedException({ code: 'DINGTALK_STATE_INVALID', message: '钉钉登录状态无效或已过期' });
      });

      const result = await service.handleDingtalkCallback('oauth-code', 'bad-state');

      expect(result).toContain('error=DINGTALK_STATE_INVALID');
      expect(dingtalkAuthClient.exchangeCodeForIdentity).not.toHaveBeenCalled();
    });

    it('解绑后新的扫码登录尝试应返回 DINGTALK_ACCOUNT_UNBOUND', async () => {
      dingtalkLoginSessionStore.consumeState.mockReturnValue();
      dingtalkAuthClient.exchangeCodeForIdentity.mockResolvedValue({
        unionId: 'union-1',
        userId: 'user-1',
        openId: 'open-1',
        nick: '张三',
        avatar: null,
      });
      usersService.findByDingtalkUnionId
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      dingtalkLoginSessionStore.createLoginTicket.mockReturnValue('ticket-1');

      const firstResult = await service.handleDingtalkCallback('oauth-code-1', 'state-1');
      const secondResult = await service.handleDingtalkCallback('oauth-code-2', 'state-2');

      expect(firstResult).toContain('ticket=ticket-1');
      expect(secondResult).toContain('error=DINGTALK_ACCOUNT_UNBOUND');
      expect(usersService.findByDingtalkUnionId).toHaveBeenNthCalledWith(1, 'union-1');
      expect(usersService.findByDingtalkUnionId).toHaveBeenNthCalledWith(2, 'union-1');
    });
  });

  describe('exchangeDingtalkTicket', () => {
    it('应返回正式 JWT 和最小用户信息', async () => {
      dingtalkLoginSessionStore.consumeLoginTicket.mockReturnValue({ userId: 1, username: 'admin' });
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.exchangeDingtalkTicket('ticket-1');

      expect(dingtalkLoginSessionStore.consumeLoginTicket).toHaveBeenCalledWith('ticket-1');
      expect(result).toEqual({
        accessToken: 'mock.jwt.token',
        user: { id: 1, username: 'admin', name: '系统管理员' },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 1, username: 'admin' });
    });

    it('ticket 过期时应抛出 DINGTALK_TICKET_EXPIRED', async () => {
      dingtalkLoginSessionStore.consumeLoginTicket.mockImplementation(() => {
        throw new UnauthorizedException({ code: 'DINGTALK_TICKET_EXPIRED', message: '登录 ticket 已过期' });
      });

      await expect(service.exchangeDingtalkTicket('expired-ticket')).rejects.toThrow(
        expect.objectContaining({ response: { code: 'DINGTALK_TICKET_EXPIRED', message: '登录 ticket 已过期' } }),
      );
    });

    it('ticket 重复使用时应抛出 DINGTALK_TICKET_USED', async () => {
      dingtalkLoginSessionStore.consumeLoginTicket.mockImplementation(() => {
        throw new UnauthorizedException({ code: 'DINGTALK_TICKET_USED', message: '登录 ticket 已被使用' });
      });

      await expect(service.exchangeDingtalkTicket('used-ticket')).rejects.toThrow(
        expect.objectContaining({ response: { code: 'DINGTALK_TICKET_USED', message: '登录 ticket 已被使用' } }),
      );
    });

    it('ticket 对应用户不存在时应抛出 DINGTALK_TICKET_INVALID', async () => {
      dingtalkLoginSessionStore.consumeLoginTicket.mockReturnValue({ userId: 999, username: 'ghost' });
      usersService.findById.mockResolvedValue(null);

      await expect(service.exchangeDingtalkTicket('ticket-missing-user')).rejects.toThrow(
        expect.objectContaining({ response: { code: 'DINGTALK_TICKET_INVALID', message: '登录 ticket 无效' } }),
      );
    });

    it('ticket 对应用户已停用时应抛出 DINGTALK_ACCOUNT_DISABLED', async () => {
      dingtalkLoginSessionStore.consumeLoginTicket.mockReturnValue({ userId: 1, username: 'admin' });
      usersService.findById.mockResolvedValue({ ...mockUser, status: UserStatus.INACTIVE });

      await expect(service.exchangeDingtalkTicket('ticket-disabled-user')).rejects.toThrow(
        expect.objectContaining({ response: { code: 'DINGTALK_ACCOUNT_DISABLED', message: '账号已停用' } }),
      );
    });
  });
});
