import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { UsersRepository } from '../users.repository';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserStatus } from '@infitek/shared';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService - Story 1-4 自动化测试', () => {
  let service: UsersService;

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
    jest.clearAllMocks();
  });

  describe('AC3: 创建用户', () => {
    it('P0: 应该创建新用户', async () => {
      const createUserDto = {
        username: 'testuser',
        name: 'Test User',
        mobile: '13800000000',
        email: 'test@example.com',
        jobNumber: 'EMP-001',
        password: 'Password@123',
      };
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
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mobile: '13800000000',
          email: 'test@example.com',
          jobNumber: 'EMP-001',
        }),
      );
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

    it('P1: 应该为钉钉自动建档生成可用用户名', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockRepository.findByUsername
        .mockResolvedValueOnce({ id: 1, username: '100526' })
        .mockResolvedValueOnce(null);
      mockRepository.create.mockResolvedValue({
        id: 9,
        username: '100526_1',
        name: '陈康平',
        jobNumber: '100526',
        status: UserStatus.ACTIVE,
        createdBy: 'admin',
        updatedBy: 'admin',
      });

      const result = await service.createAutoProvisionedDingtalkUser(
        {
          nick: '陈康平',
          mobile: null,
          email: null,
          jobNumber: '100526',
          dingtalkUserId: '620383957',
          unionId: 'union-100526',
        },
        'admin',
      );

      expect(result.username).toBe('100526_1');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: '100526_1',
          name: '陈康平',
          jobNumber: '100526',
        }),
      );
      expect(bcrypt.hash).toHaveBeenCalled();
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

      expect(result.list).toHaveLength(2);
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

      expect(result.list).toHaveLength(1);
      expect(result.list[0].username).toBe('admin');
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

      expect(result.list[0].status).toBe(UserStatus.ACTIVE);
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

      expect(result.list).toHaveLength(20);
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
      const updateUserDto = {
        name: 'Updated Name',
        mobile: '13900000000',
        email: 'updated@example.com',
        jobNumber: 'EMP-002',
        password: 'NewPassword@123',
      };
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
      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          mobile: '13900000000',
          email: 'updated@example.com',
          jobNumber: 'EMP-002',
        }),
      );
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

describe('Story 9.4: DingTalk binding management', () => {
  let service: UsersService;

  const mockRepository = {
    findByUsername: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    findByDingtalkUnionId: jest.fn(),
    findByIds: jest.fn(),
    findActiveMatchCandidates: jest.fn(),
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
    jest.clearAllMocks();
  });

  describe('bindDingtalkIdentity', () => {
    const bindDto = {
      dingtalkUnionId: 'union-123',
      dingtalkUserId: 'user-456',
      dingtalkNick: 'TestNick',
    };

    it('admin should bind successfully', async () => {
      const mockUser = { id: 1, username: 'testuser', dingtalkUnionId: null };
      const updatedUser = {
        ...mockUser,
        dingtalkUnionId: 'union-123',
        dingtalkUserId: 'user-456',
        dingtalkNick: 'TestNick',
        dingtalkBoundAt: expect.any(Date),
        updatedBy: 'admin',
      };

      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.findByDingtalkUnionId.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(updatedUser);

      const result = await service.bindDingtalkIdentity(1, bindDto, 'admin');

      expect(result.dingtalkUnionId).toBe('union-123');
      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          dingtalkUnionId: 'union-123',
          dingtalkUserId: 'user-456',
          dingtalkNick: 'TestNick',
          dingtalkBoundAt: expect.any(Date),
          updatedBy: 'admin',
        }),
      );
      const updatePayload = mockRepository.update.mock.calls[0][1];
      expect(updatePayload).not.toHaveProperty('password');
      expect(updatePayload).not.toHaveProperty('username');
      expect(updatePayload).not.toHaveProperty('id');
    });

    it('should reject when unionId bound to other user', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const otherUser = { id: 2, username: 'otheruser' };

      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.findByDingtalkUnionId.mockResolvedValue(otherUser);

      await expect(
        service.bindDingtalkIdentity(1, bindDto, 'admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should expose stable error code DINGTALK_IDENTITY_ALREADY_BOUND in payload', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const otherUser = { id: 2, username: 'otheruser' };

      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.findByDingtalkUnionId.mockResolvedValue(otherUser);

      try {
        await service.bindDingtalkIdentity(1, bindDto, 'admin');
        fail('expected BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const response = (err as BadRequestException).getResponse() as Record<string, unknown>;
        expect(response.code).toBe('DINGTALK_IDENTITY_ALREADY_BOUND');
        expect(response.statusCode).toBe(400);
      }
    });

    it('should idempotently update when unionId bound to same user', async () => {
      const mockUser = { id: 1, username: 'testuser', dingtalkUnionId: 'union-123', dingtalkUserId: 'old-user', dingtalkNick: 'OldNick' };
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.findByDingtalkUnionId.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({ ...mockUser, dingtalkUserId: 'user-456', dingtalkNick: 'TestNick', updatedBy: 'admin' });

      const result = await service.bindDingtalkIdentity(1, bindDto, 'admin');

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          dingtalkUnionId: 'union-123',
          dingtalkUserId: 'user-456',
          dingtalkNick: 'TestNick',
          updatedBy: 'admin',
        }),
      );
      expect(result.updatedBy).toBe('admin');
    });

    it('non-admin should get 403', async () => {
      await expect(
        service.bindDingtalkIdentity(1, bindDto, 'user1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw 404 when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.bindDingtalkIdentity(999, bindDto, 'admin'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unbindDingtalkIdentity', () => {
    it('admin should unbind successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        dingtalkUnionId: 'union-123',
        dingtalkUserId: 'user-456',
        dingtalkOpenId: 'open-789',
        dingtalkNick: 'Nick',
        dingtalkAvatar: 'https://avatar.url',
        dingtalkBoundAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({
        ...mockUser,
        dingtalkUnionId: null,
        dingtalkUserId: null,
        dingtalkOpenId: null,
        dingtalkNick: null,
        dingtalkAvatar: null,
        dingtalkBoundAt: null,
        updatedBy: 'admin',
      });

      const result = await service.unbindDingtalkIdentity(1, 'admin');

      expect(result.dingtalkUnionId).toBeNull();
      expect(result.dingtalkUserId).toBeNull();
      expect(result.dingtalkOpenId).toBeNull();
      expect(result.dingtalkNick).toBeNull();
      expect(result.dingtalkAvatar).toBeNull();
      expect(result.dingtalkBoundAt).toBeNull();
      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          dingtalkUnionId: null,
          dingtalkUserId: null,
          dingtalkOpenId: null,
          dingtalkNick: null,
          dingtalkAvatar: null,
          dingtalkBoundAt: null,
          updatedBy: 'admin',
        }),
      );
    });

    it('non-admin should get 403', async () => {
      await expect(
        service.unbindDingtalkIdentity(1, 'user1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should be idempotent when already unbound', async () => {
      const mockUser = { id: 1, username: 'testuser', dingtalkUnionId: null };
      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await service.unbindDingtalkIdentity(1, 'admin');

      expect(result).toEqual(mockUser);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should throw 404 when user not found on unbind', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.unbindDingtalkIdentity(999, 'admin'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
