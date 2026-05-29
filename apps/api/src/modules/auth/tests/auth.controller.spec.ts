import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  const response = {
    redirect: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60000,
            limit: 10,
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            getDingtalkLoginRedirectUrl: jest.fn(),
            handleDingtalkCallback: jest.fn(),
            exchangeDingtalkTicket: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('login', () => {
    it('应返回 accessToken', async () => {
      authService.login.mockResolvedValue({ accessToken: 'mock.jwt.token' });

      const result = await controller.login({ username: 'admin', password: 'Admin@123' });

      expect(result).toEqual({ accessToken: 'mock.jwt.token' });
      expect(authService.login).toHaveBeenCalledWith('admin', 'Admin@123');
    });

    it('登录失败时应透传 UnauthorizedException', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' }),
      );

      await expect(controller.login({ username: 'admin', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('dingtalkLogin', () => {
    it('应重定向到钉钉授权页', () => {
      authService.getDingtalkLoginRedirectUrl.mockReturnValue('https://login.dingtalk.com/oauth2/auth?state=abc');

      controller.dingtalkLogin(response);

      expect(response.redirect).toHaveBeenCalledWith(302, 'https://login.dingtalk.com/oauth2/auth?state=abc');
    });

    it('应启用限流守卫', () => {
      expect(Reflect.getMetadata('__guards__', AuthController.prototype.dingtalkLogin)).toContain(ThrottlerGuard);
    });
  });

  describe('dingtalkCallback', () => {
    it('应重定向到前端 callback 页面', async () => {
      authService.handleDingtalkCallback.mockResolvedValue('http://localhost:5173/login/dingtalk/callback?ticket=t1');

      await controller.dingtalkCallback('oauth-code', 'state-1', response);

      expect(authService.handleDingtalkCallback).toHaveBeenCalledWith('oauth-code', 'state-1');
      expect(response.redirect).toHaveBeenCalledWith(
        302,
        'http://localhost:5173/login/dingtalk/callback?ticket=t1',
      );
    });
  });

  describe('exchangeDingtalkTicket', () => {
    it('应透传 ticket 交换结果', async () => {
      authService.exchangeDingtalkTicket.mockResolvedValue({
        accessToken: 'mock.jwt.token',
        user: { id: 1, username: 'admin', name: '系统管理员' },
      });

      const result = await controller.exchangeDingtalkTicket({ ticket: 'ticket-1' });

      expect(authService.exchangeDingtalkTicket).toHaveBeenCalledWith('ticket-1');
      expect(result).toEqual({
        accessToken: 'mock.jwt.token',
        user: { id: 1, username: 'admin', name: '系统管理员' },
      });
    });

    it('应启用限流守卫', () => {
      expect(Reflect.getMetadata('__guards__', AuthController.prototype.exchangeDingtalkTicket)).toContain(ThrottlerGuard);
    });
  });

  describe('login throttle', () => {
    it('用户名密码登录应启用限流守卫', () => {
      expect(Reflect.getMetadata('__guards__', AuthController.prototype.login)).toContain(ThrottlerGuard);
    });
  });
});
