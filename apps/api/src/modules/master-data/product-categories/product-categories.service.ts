import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductCategoriesRepository, ProductCategoryNode } from './product-categories.repository';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { QueryProductCategoryDto } from './dto/query-product-category.dto';

@Injectable()
export class ProductCategoriesService {
  constructor(private readonly repo: ProductCategoriesRepository) {}

  findTree(): Promise<ProductCategoryNode[]> {
    return this.repo.findTree();
  }

  findAll(query: QueryProductCategoryDto) {
    return this.repo.findAll(query);
  }

  async findById(id: number) {
    const cat = await this.repo.findById(id);
    if (!cat) throw new NotFoundException('产品分类不存在');
    return cat;
  }

  async create(dto: CreateProductCategoryDto, operator?: string) {
    const dup = await this.repo.findByName(dto.name);
    if (dup) throw new BadRequestException('分类名称已存在');

    let level = 1;
    if (dto.parentId) {
      const parent = await this.repo.findById(dto.parentId);
      if (!parent) throw new NotFoundException('父级分类不存在');
      if (parent.level >= 3) throw new BadRequestException('已达最大层级（3级），不能继续添加子分类');
      level = parent.level + 1;
    }

    const code = await this.repo.generateCode();

    return this.repo.create({
      name: dto.name,
      nameEn: dto.nameEn ?? null,
      code,
      parentId: dto.parentId ?? null,
      level,
      sortOrder: 0,
      purchaseOwner: dto.purchaseOwner ?? null,
      productOwner: dto.productOwner ?? null,
      createdBy: operator,
      updatedBy: operator,
    });
  }

  async update(id: number, dto: UpdateProductCategoryDto, operator?: string) {
    const cat = await this.repo.findById(id);
    if (!cat) throw new NotFoundException('产品分类不存在');

    if (dto.name && dto.name !== cat.name) {
      const dup = await this.repo.findByName(dto.name);
      if (dup && dup.id !== id) throw new BadRequestException('分类名称已存在');
    }

    return this.repo.update(id, {
      name: dto.name,
      nameEn: dto.nameEn,
      purchaseOwner: dto.purchaseOwner,
      productOwner: dto.productOwner,
      updatedBy: operator,
    });
  }
}
