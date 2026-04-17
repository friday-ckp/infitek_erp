import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { User, UserStatus } from '../../users/entities/user.entity';

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
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { findByUsername: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock.jwt.token') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
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
  });
});
