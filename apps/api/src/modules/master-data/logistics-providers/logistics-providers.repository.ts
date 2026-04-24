import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { QueryLogisticsProviderDto } from './dto/query-logistics-provider.dto';
import { LogisticsProvider } from './entities/logistics-provider.entity';

@Injectable()
export class LogisticsProvidersRepository {
  constructor(
    @InjectRepository(LogisticsProvider)
    private readonly repo: Repository<LogisticsProvider>,
  ) {}

  findById(id: number): Promise<LogisticsProvider | null> {
    return this.repo.findOne({ where: { id, deletedAt: IsNull() } });
  }

  findByName(name: string): Promise<LogisticsProvider | null> {
    return this.repo.findOne({ where: { name, deletedAt: IsNull() } });
  }

  findByCode(providerCode: string): Promise<LogisticsProvider | null> {
    return this.repo.findOne({ where: { providerCode, deletedAt: IsNull() } });
  }

  async findLatestCode(): Promise<string | null> {
    const latest = await this.repo
      .createQueryBuilder('provider')
      .where('provider.deleted_at IS NULL')
      .andWhere('provider.provider_code LIKE :prefix', { prefix: 'YCWL%' })
      .orderBy('provider.provider_code', 'DESC')
      .getOne();

    return latest?.providerCode ?? null;
  }

  async findAll(query: QueryLogisticsProviderDto) {
    const { keyword, page = 1, pageSize = 20 } = query;

    const qb = this.repo
      .createQueryBuilder('provider')
      .where('provider.deleted_at IS NULL');

    if (keyword) {
      qb.andWhere(
        '(provider.name LIKE :kw OR provider.provider_code LIKE :kw OR provider.contact_person LIKE :kw OR provider.contact_phone LIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }

    const [list, total] = await qb
      .orderBy('provider.created_at', 'DESC')
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

  create(data: Partial<LogisticsProvider>): Promise<LogisticsProvider> {
    return this.repo.save(data);
  }

  async update(id: number, data: Partial<LogisticsProvider>): Promise<LogisticsProvider> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id, deletedAt: IsNull() } });
  }
}
