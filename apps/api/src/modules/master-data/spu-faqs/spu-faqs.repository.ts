import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpuFaq } from './entities/spu-faq.entity';
import { QuerySpuFaqDto } from './dto/query-spu-faq.dto';

@Injectable()
export class SpuFaqsRepository {
  constructor(
    @InjectRepository(SpuFaq)
    private readonly repo: Repository<SpuFaq>,
  ) {}

  async findAll(query: QuerySpuFaqDto) {
    const { keyword, page = 1, pageSize = 20, spuId, questionType, spuCode } = query;
    const qb = this.repo.createQueryBuilder('f');

    if (spuId !== undefined) {
      qb.andWhere('f.spu_id = :spuId', { spuId });
    }
    if (spuCode) {
      qb.andWhere('f.spu_code = :spuCode', { spuCode });
    }
    if (questionType) {
      qb.andWhere('f.question_type = :questionType', { questionType });
    }
    if (keyword) {
      qb.andWhere('(f.question LIKE :kw OR f.answer LIKE :kw)', { kw: `%${keyword}%` });
    }

    const [list, total] = await qb
      .orderBy('f.sort_order', 'ASC')
      .addOrderBy('f.created_at', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  findBySpu(spuId: number): Promise<SpuFaq[]> {
    return this.repo.find({
      where: { spuId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  findById(id: number): Promise<SpuFaq | null> {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<SpuFaq>): Promise<SpuFaq> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<SpuFaq>): Promise<SpuFaq> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
