import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategory } from './entities/product-category.entity';
import { QueryProductCategoryDto } from './dto/query-product-category.dto';

export interface ProductCategoryNode extends ProductCategory {
  children: ProductCategoryNode[];
}

@Injectable()
export class ProductCategoriesRepository {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly repo: Repository<ProductCategory>,
  ) {}

  async findTree(): Promise<ProductCategoryNode[]> {
    const all = await this.repo.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } });
    return this.buildTree(all);
  }

  private buildTree(items: ProductCategory[], parentId: number | null = null): ProductCategoryNode[] {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        ...item,
        children: this.buildTree(items, item.id),
      }));
  }

  async findAll(query: QueryProductCategoryDto) {
    const { keyword, page = 1, pageSize = 20, parentId } = query;

    const qb = this.repo.createQueryBuilder('pc');

    if (keyword) {
      qb.where('pc.name LIKE :kw', { kw: `%${keyword}%` });
    }

    if (parentId !== undefined) {
      qb.andWhere('pc.parent_id = :parentId', { parentId });
    }

    const [list, total] = await qb
      .orderBy('pc.sort_order', 'ASC')
      .addOrderBy('pc.created_at', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  findById(id: number): Promise<ProductCategory | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByName(name: string): Promise<ProductCategory | null> {
    return this.repo.findOne({ where: { name } });
  }

  async generateCode(): Promise<string> {
    const result = await this.repo
      .createQueryBuilder('pc')
      .select('MAX(pc.code)', 'maxCode')
      .where('pc.code LIKE :prefix', { prefix: 'CPDL%' })
      .getRawOne<{ maxCode: string | null }>();

    const maxCode = result?.maxCode;
    let nextSeq = 1;
    if (maxCode) {
      const num = parseInt(maxCode.replace('CPDL', ''), 10);
      if (!isNaN(num)) nextSeq = num + 1;
    }
    return `CPDL${String(nextSeq).padStart(3, '0')}`;
  }

  create(data: Partial<ProductCategory>): Promise<ProductCategory> {
    return this.repo.save(data);
  }

  async update(id: number, data: Partial<ProductCategory>): Promise<ProductCategory> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  countChildren(parentId: number): Promise<number> {
    return this.repo.count({ where: { parentId } });
  }
}
