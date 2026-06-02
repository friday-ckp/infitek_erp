import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
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

  findByDingtalkUnionId(dingtalkUnionId: string): Promise<User | null> {
    return this.repo.findOne({ where: { dingtalkUnionId, deletedAt: IsNull() } });
  }

  findByIds(ids: number[]): Promise<User[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }

    return this.repo.find({ where: { id: In(ids), deletedAt: IsNull() } });
  }

  async findActiveMatchCandidates(identifiers: {
    mobile?: string | null;
    email?: string | null;
    jobNumber?: string | null;
  }): Promise<User[]> {
    const { mobile, email, jobNumber } = identifiers;
    const values = [mobile, email, jobNumber].filter((value): value is string => Boolean(value));
    if (values.length === 0) {
      return [];
    }

    const query = this.repo.createQueryBuilder('user')
      .where('user.deletedAt IS NULL')
      .andWhere('user.status = :status', { status: 'active' })
      .andWhere(
        '(user.mobile = :mobile OR user.email = :email OR user.jobNumber = :jobNumber)',
        {
          mobile: mobile ?? null,
          email: email ?? null,
          jobNumber: jobNumber ?? null,
        },
      );

    return query.getMany();
  }

  findAll(page: number = 1, pageSize: number = 10, search?: string, status?: string): Promise<[User[], number]> {
    const query = this.repo.createQueryBuilder('user').where('user.deletedAt IS NULL');

    if (search) {
      query.andWhere('(user.username LIKE :search OR user.name LIKE :search OR user.mobile LIKE :search OR user.email LIKE :search OR user.jobNumber LIKE :search)', {
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

  async update(id: number, user: Partial<User>): Promise<User> {
    await this.repo.update(id, user);
    return this.repo.findOneOrFail({ where: { id } });
  }

  softDelete(id: number): Promise<void> {
    return this.repo.softDelete(id).then(() => undefined);
  }
}
