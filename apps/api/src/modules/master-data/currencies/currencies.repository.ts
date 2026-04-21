import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { QueryCurrencyDto } from './dto/query-currency.dto';
import { Currency } from './entities/currency.entity';

@Injectable()
export class CurrenciesRepository {
  constructor(
    @InjectRepository(Currency)
    private readonly repo: Repository<Currency>,
  ) {}

  findById(id: number): Promise<Currency | null> {
    return this.repo.findOne({ where: { id, deletedAt: IsNull() } });
  }

  findByCode(code: string): Promise<Currency | null> {
    return this.repo.findOne({ where: { code, deletedAt: IsNull() } });
  }

  async findAll(query: QueryCurrencyDto) {
    const { keyword, page = 1, pageSize = 20, status } = query;

    const qb = this.repo
      .createQueryBuilder('currency')
      .where('currency.deleted_at IS NULL');

    if (keyword) {
      qb.andWhere('(currency.name LIKE :kw OR currency.code LIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }

    if (status) {
      qb.andWhere('currency.status = :status', { status });
    }

    const [list, total] = await qb
      .orderBy('currency.created_at', 'DESC')
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

  create(data: Partial<Currency>): Promise<Currency> {
    return this.repo.save(data);
  }

  async update(id: number, data: Partial<Currency>): Promise<Currency> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id, deletedAt: IsNull() } });
  }

  async clearBaseCurrency(): Promise<void> {
    await this.repo.update({ deletedAt: IsNull() }, { isBaseCurrency: 0 });
  }
}
