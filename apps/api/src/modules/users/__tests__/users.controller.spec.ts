import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserStatus } from '@infitek/shared';
import { NotFoundException } from '@nestjs/common';

describe('UsersController - Story 1-4 自动化测试', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('AC1: 用户列表页面', () => {
    it('P0: 应该返回用户列表（无筛选）', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'admin',
          name: 'Admin User',
          status: UserStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          updatedBy: 'system',
        },
        {
          id: 2,
          username: 'user1',
          name: 'User One',
          status: UserStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'admin',
          updatedBy: 'admin',
        },
      ];

      mockUsersService.findAll.mockResolvedValue({
        data: mockUsers,
        total: 2,
        page: 1,
        pageSize: 20,
      });

      const result = await controller.findAll('1', '20', undefined);

      expect(result.success).toBe(true);
      expect(result.data.data).toHaveLength(2);
      expect(result.data.total).toBe(2);
      expect(mockUsersService.findAll).toHaveBeenCalledWith(1, 20, undefined);
    });

    it('P1: 应该支持按用户名搜索', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'admin',
          name: 'Admin User',
          status: UserStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          updatedBy: 'system',
        },
      ];

      mockUsersService.findAll.mockResolvedValue({
        data: mockUsers,
        total: 1,
        page: 1,
        pageSize: 20,
      });

      const result = await controller.findAll('1', '20', 'admin');

      expect(result.data.data).toHaveLength(1);
      expect(result.data.data[0].username).toBe('admin');
      expect(mockUsersService.findAll).toHaveBeenCalledWith(1, 20, 'admin');
    });

    it('P1: 应该支持分页', async () => {
      const mockUsers = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        username: `user${i + 1}`,
        name: `User ${i + 1}`,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
        updatedBy: 'admin',
      }));

      mockUsersService.findAll.mockResolvedValue({
        data: mockUsers,
        total: 100,
        page: 1,
        pageSize: 20,
      });

      const result = await controller.findAll('1', '20', undefined);

      expect(result.data.data).toHaveLength(20);
      expect(result.data.total).toBe(100);
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    });
  });

  describe('AC2: 用户详情页面', () => {
    it('P0: 应该返回用户详情', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        name: 'Admin User',
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
      };

      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await controller.findById(1);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
      expect(result.data.username).toBe('admin');
      expect(result.data.createdBy).toBe('system');
      expect(result.data.updatedBy).toBe('system');
    });

    it('P1: 应该返回 404 当用户不存在', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      const result = await controller.findById(999);

      expect(result.success).toBe(false);
      expect(result.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('AC3: 创建用户', () => {
    it('P0: 应该创建新用户（成功）', async () => {
      const createUserDto: CreateUserDto = {
        username: 'newuser',
        name: 'New User',
        password: 'Password@123',
      };

      const createdUser = {
        id: 3,
        ...createUserDto,
        password: 'hashed_password',
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
        updatedBy: 'admin',
      };

      mockUsersService.create.mockResolvedValue(createdUser);

      const result = await controller.create(createUserDto, { username: 'admin' });

      expect(result.success).toBe(true);
      expect(result.data.username).toBe('newuser');
      expect(result.data.status).toBe(UserStatus.ACTIVE);
      expect(result.data.createdBy).toBe('admin');
    });
  });

  describe('AC4: 编辑用户', () => {
    it('P0: 应该编辑用户信息（成功）', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
        password: 'NewPassword@123',
      };

      const updatedUser = {
        id: 1,
        username: 'admin',
        name: 'Updated Name',
        password: 'hashed_new_password',
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'admin',
      };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(1, updateUserDto, { username: 'admin' });

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Name');
      expect(result.data.updatedBy).toBe('admin');
    });

    it('P1: 应该返回 404 当用户不存在', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      mockUsersService.update.mockRejectedValue(new NotFoundException('用户不存在'));

      try {
        await controller.update(999, updateUserDto, { username: 'admin' });
        fail('Should have thrown NotFoundException');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });

  describe('AC5: 停用用户', () => {
    it('P0: 应该停用用户（成功）', async () => {
      const deactivatedUser = {
        id: 1,
        username: 'admin',
        name: 'Admin User',
        status: UserStatus.INACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'admin',
      };

      mockUsersService.deactivate.mockResolvedValue(deactivatedUser);

      const result = await controller.deactivate(1, { username: 'admin' });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(UserStatus.INACTIVE);
    });
  });
});
