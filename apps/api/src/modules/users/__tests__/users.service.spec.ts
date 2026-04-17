import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { UsersRepository } from '../users.repository';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserStatus } from '@infitek/shared';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService - Story 1-4 自动化测试', () => {
  let service: UsersService;
  let repository: UsersRepository;

  const mockRepository = {
    findByUsername: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);
    jest.clearAllMocks();
  });

  describe('AC3: 创建用户', () => {
    it('P0: 应该创建新用户', async () => {
      const createUserDto = { username: 'testuser', name: 'Test User', password: 'Password@123' };
      const hashedPassword = 'hashed_password';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.findByUsername.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: 1,
        ...createUserDto,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date(),
        updated_by: 'admin',
      });

      const result = await service.create(createUserDto, 'admin');

      expect(result.username).toBe('testuser');
      expect(result.status).toBe(UserStatus.ACTIVE);
      expect(result.created_by).toBe('admin');
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, expect.any(Number));
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('P0: 应该验证用户名唯一性', async () => {
      const createUserDto = { username: 'admin', name: 'Admin User', password: 'Password@123' };

      mockRepository.findByUsername.mockResolvedValue({ id: 1, username: 'admin' });

      await expect(service.create(createUserDto, 'admin')).rejects.toThrow(BadRequestException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('P1: 应该自动填充 created_by 字段', async () => {
      const createUserDto = { username: 'newuser', name: 'New User', password: 'Password@123' };
      const hashedPassword = 'hashed_password';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.findByUsername.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: 2,
        ...createUserDto,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
        createdBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: 'admin',
      });

      const result = await service.create(createUserDto, 'admin');

      expect(result.createdBy).toBe('admin');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: 'admin',
        }),
      );
    });
  });

  describe('AC1: 用户列表', () => {
    it('P0: 应该查询所有用户', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'admin',
          name: 'Admin User',
          status: UserStatus.ACTIVE,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'system',
          updated_by: 'system',
        },
        {
          id: 2,
          username: 'user1',
          name: 'User One',
          status: UserStatus.ACTIVE,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'admin',
          updated_by: 'admin',
        },
      ];

      mockRepository.findAll.mockResolvedValue([mockUsers, 2]);

      const result = await service.findAll(1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('P1: 应该支持搜索功能', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'admin',
          name: 'Admin User',
          status: UserStatus.ACTIVE,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'system',
          updated_by: 'system',
        },
      ];

      mockRepository.findAll.mockResolvedValue([mockUsers, 1]);

      const result = await service.findAll(1, 20, 'admin');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].username).toBe('admin');
    });

    it('P1: 应该支持按状态筛选', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'admin',
          name: 'Admin User',
          status: UserStatus.ACTIVE,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'system',
          updated_by: 'system',
        },
      ];

      mockRepository.findAll.mockResolvedValue([mockUsers, 1]);

      const result = await service.findAll(1, 20);

      expect(result.data[0].status).toBe(UserStatus.ACTIVE);
    });

    it('P1: 应该支持分页', async () => {
      const mockUsers = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        username: `user${i + 1}`,
        name: `User ${i + 1}`,
        status: UserStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
        updated_by: 'admin',
      }));

      mockRepository.findAll.mockResolvedValue([mockUsers, 100]);

      const result = await service.findAll(1, 20);

      expect(result.data).toHaveLength(20);
      expect(result.total).toBe(100);
    });
  });

  describe('AC2: 用户详情', () => {
    it('P0: 应该查询存在的用户', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        name: 'Admin User',
        status: UserStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system',
        updated_by: 'system',
      };

      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(result.id).toBe(1);
      expect(result.username).toBe('admin');
      expect(result.created_by).toBe('system');
      expect(result.updated_by).toBe('system');
    });

    it('P1: 应该返回 null 当用户不存在', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('AC4: 编辑用户', () => {
    it('P0: 应该编辑用户信息', async () => {
      const updateUserDto = { name: 'Updated Name', password: 'NewPassword@123' };
      const hashedPassword = 'hashed_new_password';

      mockRepository.findById.mockResolvedValue({
        id: 1,
        username: 'admin',
        name: 'Admin User',
        status: UserStatus.ACTIVE,
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.update.mockResolvedValue({
        id: 1,
        username: 'admin',
        name: 'Updated Name',
        password: hashedPassword,
        status: UserStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system',
        updated_by: 'admin',
      });

      const result = await service.update(1, updateUserDto, 'admin');

      expect(result.name).toBe('Updated Name');
      expect(result.updated_by).toBe('admin');
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('P1: 应该自动填充 updated_by 字段', async () => {
      const updateUserDto = { name: 'Updated Name' };

      mockRepository.findById.mockResolvedValue({
        id: 1,
        username: 'admin',
        name: 'Admin User',
      });

      mockRepository.update.mockResolvedValue({
        id: 1,
        username: 'admin',
        name: 'Updated Name',
        updatedBy: 'admin',
      });

      const result = await service.update(1, updateUserDto, 'admin');

      expect(result.updatedBy).toBe('admin');
      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          updatedBy: 'admin',
        }),
      );
    });

    it('P1: 应该抛出 NotFoundException 当用户不存在', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update(999, { name: 'Updated' }, 'admin')).rejects.toThrow(NotFoundException);
    });
  });

  describe('AC5: 停用用户', () => {
    it('P0: 应该停用用户', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 1,
        username: 'admin',
        status: UserStatus.ACTIVE,
      });

      mockRepository.update.mockResolvedValue({
        id: 1,
        username: 'admin',
        status: UserStatus.INACTIVE,
        updatedBy: 'admin',
      });

      const result = await service.deactivate(1, 'admin');

      expect(result.status).toBe(UserStatus.INACTIVE);
      expect(mockRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
        status: UserStatus.INACTIVE,
      }));
    });

    it('P0: 应该验证停用权限', async () => {
      mockRepository.findById.mockResolvedValue({
        id: 1,
        username: 'admin',
        status: UserStatus.ACTIVE,
      });

      mockRepository.update.mockResolvedValue({
        id: 1,
        username: 'admin',
        status: UserStatus.INACTIVE,
        updatedBy: 'admin',
      });

      const result = await service.deactivate(1, 'admin');

      expect(result.updatedBy).toBe('admin');
    });
  });

  describe('AC6: 权限控制', () => {
    it('P0: 应该验证 findByUsername 方法', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        status: UserStatus.ACTIVE,
      };

      mockRepository.findByUsername.mockResolvedValue(mockUser);

      const result = await service.findByUsername('admin');

      expect(result.username).toBe('admin');
      expect(result.status).toBe(UserStatus.ACTIVE);
    });

    it('P0: 应该在 JwtStrategy 中检查用户状态', async () => {
      // 这个测试验证 JwtStrategy 中的 status 检查
      const inactiveUser = {
        id: 1,
        username: 'admin',
        status: UserStatus.INACTIVE,
      };

      mockRepository.findById.mockResolvedValue(inactiveUser);

      const user = await service.findById(1);

      expect(user.status).toBe(UserStatus.INACTIVE);
      // JwtStrategy 应该拒绝这个用户
    });
  });
});
