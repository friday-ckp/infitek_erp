import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findByUsername(username: string): Promise<User | null> {
    return this.repo.findOne({ where: { username, deletedAt: IsNull() } });
  }

  findById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id, deletedAt: IsNull() } });
  }

  findAll(page: number = 1, pageSize: number = 10, search?: string, status?: string): Promise<[User[], number]> {
    const query = this.repo.createQueryBuilder('user').where('user.deletedAt IS NULL');

    if (search) {
      query.andWhere('(user.username LIKE :search OR user.name LIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (status) {
      query.andWhere('user.status = :status', { status });
    }

    return query
      .orderBy('user.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
  }

  create(user: Partial<User>): Promise<User> {
    return this.repo.save(user);
  }

  update(id: number, user: Partial<User>): Promise<User> {
    return this.repo.save({ id, ...user });
  }

  softDelete(id: number): Promise<void> {
    return this.repo.softDelete(id).then(() => undefined);
  }
}

