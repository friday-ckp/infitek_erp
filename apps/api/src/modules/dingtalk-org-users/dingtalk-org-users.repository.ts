import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { DingtalkOrgUser } from './entities/dingtalk-org-user.entity';
import { QueryDingtalkOrgUsersDto } from './dto/query-dingtalk-org-users.dto';

@Injectable()
export class DingtalkOrgUsersRepository {
  constructor(
    @InjectRepository(DingtalkOrgUser)
    private readonly repo: Repository<DingtalkOrgUser>,
  ) {}

  findByUnionId(unionId: string): Promise<DingtalkOrgUser | null> {
    return this.repo.findOne({ where: { unionId, deletedAt: IsNull() } });
  }

  findById(id: number): Promise<DingtalkOrgUser | null> {
    return this.repo.findOne({ where: { id, deletedAt: IsNull() } });
  }

  async findAll(query: QueryDingtalkOrgUsersDto) {
    const { page = 1, pageSize = 20, keyword, status } = query;
    const qb = this.repo
      .createQueryBuilder('dingtalkOrgUser')
      .where('dingtalkOrgUser.deletedAt IS NULL');

    if (status) {
      qb.andWhere('dingtalkOrgUser.status = :status', { status });
    }

    if (keyword) {
      qb.andWhere(
        '(dingtalkOrgUser.unionId LIKE :keyword OR dingtalkOrgUser.nick LIKE :keyword OR dingtalkOrgUser.mobile LIKE :keyword OR dingtalkOrgUser.email LIKE :keyword OR dingtalkOrgUser.jobNumber LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const [list, total] = await qb
      .orderBy('dingtalkOrgUser.lastSyncedAt', 'DESC')
      .addOrderBy('dingtalkOrgUser.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  create(entity: Partial<DingtalkOrgUser>): Promise<DingtalkOrgUser> {
    return this.repo.save(entity);
  }

  async update(id: number, entity: Partial<DingtalkOrgUser>): Promise<DingtalkOrgUser> {
    await this.repo.update(id, entity);
    return this.repo.findOneOrFail({ where: { id } });
  }
}
