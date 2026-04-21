import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Spu } from './entities/spu.entity';
import { QuerySpuDto } from './dto/query-spu.dto';

@Injectable()
export class SpusRepository {
  constructor(
    @InjectRepository(Spu)
    private readonly repo: Repository<Spu>,
  ) {}

  async findAll(query: QuerySpuDto) {
    const { keyword, page = 1, pageSize = 20, categoryId } = query;
    const qb = this.repo.createQueryBuilder('s');
    if (keyword) {
      qb.where('(s.name LIKE :kw OR s.spu_code LIKE :kw)', { kw: `%${keyword}%` });
    }
    if (categoryId !== undefined) {
      qb.andWhere('s.category_id = :categoryId', { categoryId });
    }
    const [list, total] = await qb
      .orderBy('s.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  findById(id: number): Promise<Spu | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByCode(code: string): Promise<Spu | null> {
    return this.repo.findOne({ where: { spuCode: code } });
  }

  async generateCode(): Promise<string> {
    const result = await this.repo
      .createQueryBuilder('s')
      .select('MAX(CAST(SUBSTRING(s.spu_code, 4) AS UNSIGNED))', 'maxSeq')
      .where('s.spu_code LIKE :prefix', { prefix: 'SPU%' })
      .getRawOne<{ maxSeq: number | null }>();
    const nextSeq = (result?.maxSeq ?? 0) + 1;
    return `SPU${String(nextSeq).padStart(3, '0')}`;
  }

  create(data: Partial<Spu>): Promise<Spu> {
    return this.repo.save(data);
  }

  async update(id: number, data: Partial<Spu>): Promise<Spu> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
