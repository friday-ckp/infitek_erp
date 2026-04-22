import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sku } from './entities/sku.entity';
import { QuerySkuDto } from './dto/query-sku.dto';

@Injectable()
export class SkusRepository {
  constructor(
    @InjectRepository(Sku)
    private readonly repo: Repository<Sku>,
  ) {}

  async findAll(query: QuerySkuDto) {
    const { keyword, page = 1, pageSize = 20, spuId, categoryId } = query;
    const qb = this.repo.createQueryBuilder('k');
    if (keyword) {
      qb.where(
        '(k.sku_code LIKE :kw OR k.name_cn LIKE :kw OR k.name_en LIKE :kw OR k.specification LIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }
    if (spuId !== undefined) {
      qb.andWhere('k.spu_id = :spuId', { spuId });
    }
    if (categoryId !== undefined) {
      qb.andWhere(
        'k.spu_id IN (SELECT id FROM spus WHERE category_id = :categoryId)',
        { categoryId },
      );
    }
    const [list, total] = await qb
      .orderBy('k.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  findById(id: number): Promise<Sku | null> {
    return this.repo.findOne({ where: { id } });
  }

  async generateCode(): Promise<string> {
    const result = await this.repo
      .createQueryBuilder('k')
      .select('MAX(CAST(SUBSTRING(k.sku_code, 4) AS UNSIGNED))', 'maxSeq')
      .where('k.sku_code LIKE :prefix', { prefix: 'SKU%' })
      .getRawOne<{ maxSeq: number | null }>();
    const nextSeq = (result?.maxSeq ?? 0) + 1;
    return `SKU${String(nextSeq).padStart(3, '0')}`;
  }

  create(data: Partial<Sku>): Promise<Sku> {
    return this.repo.save(data);
  }

  async update(id: number, data: Partial<Sku>): Promise<Sku> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
