import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
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
});
