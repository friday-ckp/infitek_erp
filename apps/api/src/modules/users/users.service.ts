import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '@infitek/shared';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findByUsername(username);
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findById(id);
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
}

