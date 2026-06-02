import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BindDingtalkDto } from './dto/bind-dingtalk.dto';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '@infitek/shared';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findByUsername(username);
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  findByDingtalkUnionId(dingtalkUnionId: string): Promise<User | null> {
    return this.usersRepository.findByDingtalkUnionId(dingtalkUnionId);
  }

  findByIds(ids: number[]): Promise<User[]> {
    return this.usersRepository.findByIds(ids);
  }

  findActiveMatchCandidates(identifiers: {
    mobile?: string | null;
    email?: string | null;
    jobNumber?: string | null;
  }): Promise<User[]> {
    return this.usersRepository.findActiveMatchCandidates(identifiers);
  }

  async findAll(page: number = 1, pageSize: number = 10, search?: string, status?: string) {
    const [users, total] = await this.usersRepository.findAll(page, pageSize, search, status);
    return {
      list: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async create(createUserDto: CreateUserDto, createdBy: string): Promise<User> {
    const existingUser = await this.usersRepository.findByUsername(createUserDto.username);
    if (existingUser) {
      throw new BadRequestException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    return this.usersRepository.create({
      username: createUserDto.username,
      name: createUserDto.name,
      mobile: createUserDto.mobile ?? null,
      email: createUserDto.email ?? null,
      jobNumber: createUserDto.jobNumber ?? null,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      createdBy: createdBy,
      updatedBy: createdBy,
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto, updatedBy: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const updateData: Partial<User> = { updatedBy: updatedBy };
    if (updateUserDto.name) {
      updateData.name = updateUserDto.name;
    }
    if (updateUserDto.status) {
      updateData.status = updateUserDto.status;
    }
    if (updateUserDto.mobile !== undefined) {
      updateData.mobile = updateUserDto.mobile || null;
    }
    if (updateUserDto.email !== undefined) {
      updateData.email = updateUserDto.email || null;
    }
    if (updateUserDto.jobNumber !== undefined) {
      updateData.jobNumber = updateUserDto.jobNumber || null;
    }

    return this.usersRepository.update(id, updateData);
  }

  async deactivate(id: number, updatedBy: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return this.usersRepository.update(id, {
      status: UserStatus.INACTIVE,
      updatedBy: updatedBy,
    });
  }

  async bindDingtalkIdentity(
    userId: number,
    dto: BindDingtalkDto,
    operatorUsername: string,
  ): Promise<User> {
    if (operatorUsername !== 'admin') {
      throw new ForbiddenException('只有管理员可以执行钉钉绑定操作');
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const existingUser = await this.usersRepository.findByDingtalkUnionId(dto.dingtalkUnionId);
    if (existingUser && existingUser.id !== userId) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'DINGTALK_IDENTITY_ALREADY_BOUND',
        message: '该钉钉账号已绑定其他 ERP 用户',
      });
    }

    const updateData: Partial<User> = {
      dingtalkUnionId: dto.dingtalkUnionId,
      dingtalkUserId: dto.dingtalkUserId ?? user.dingtalkUserId,
      dingtalkOpenId: dto.dingtalkOpenId ?? user.dingtalkOpenId,
      dingtalkNick: dto.dingtalkNick ?? user.dingtalkNick,
      dingtalkAvatar: dto.dingtalkAvatar ?? user.dingtalkAvatar,
      dingtalkBoundAt: new Date(),
      updatedBy: operatorUsername,
    };

    try {
      return await this.usersRepository.update(userId, updateData);
    } catch (err) {
      if (err instanceof QueryFailedError && (err as any).code === '23505') {
        throw new BadRequestException({
          statusCode: 400,
          code: 'DINGTALK_IDENTITY_ALREADY_BOUND',
          message: '该钉钉账号已绑定其他 ERP 用户',
        });
      }
      throw err;
    }
  }

  async unbindDingtalkIdentity(userId: number, operatorUsername: string): Promise<User> {
    if (operatorUsername !== 'admin') {
      throw new ForbiddenException('只有管理员可以执行钉钉解绑操作');
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (!user.dingtalkUnionId) {
      return user;
    }

    return this.usersRepository.update(userId, {
      dingtalkUnionId: null,
      dingtalkUserId: null,
      dingtalkOpenId: null,
      dingtalkNick: null,
      dingtalkAvatar: null,
      dingtalkBoundAt: null,
      updatedBy: operatorUsername,
    });
  }
}
