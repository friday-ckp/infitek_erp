import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SpusRepository } from './spus.repository';
import { ProductCategoriesService } from '../product-categories/product-categories.service';
import { CreateSpuDto } from './dto/create-spu.dto';
import { UpdateSpuDto } from './dto/update-spu.dto';
import { QuerySpuDto } from './dto/query-spu.dto';

@Injectable()
export class SpusService {
  constructor(
    private readonly repo: SpusRepository,
    private readonly categoriesService: ProductCategoriesService,
  ) {}

  findAll(query: QuerySpuDto) {
    return this.repo.findAll(query);
  }

  async findById(id: number) {
    const spu = await this.repo.findById(id);
    if (!spu) throw new NotFoundException('SPU 不存在');
    return spu;
  }

  async create(dto: CreateSpuDto, operator?: string) {
    const category = await this.categoriesService.findById(dto.categoryId);
    if (category.level !== 3) throw new BadRequestException('只能选择三级（末级）分类');

    let categoryLevel2Id: number | null = null;
    let categoryLevel1Id: number | null = null;
    if (category.parentId) {
      const level2 = await this.categoriesService.findById(category.parentId).catch(() => null);
      if (level2) {
        categoryLevel2Id = level2.id;
        if (level2.parentId) {
          const level1 = await this.categoriesService.findById(level2.parentId).catch(() => null);
          if (level1) categoryLevel1Id = level1.id;
        }
      }
    }

    const spuCode = await this.repo.generateCode();

    return this.repo.create({
      spuCode,
      name: dto.name,
      categoryId: dto.categoryId,
      categoryLevel1Id,
      categoryLevel2Id,
      unit: dto.unit ?? null,
      manufacturerModel: dto.manufacturerModel ?? null,
      customerWarrantyMonths: dto.customerWarrantyMonths ?? null,
      purchaseWarrantyMonths: dto.purchaseWarrantyMonths ?? null,
      supplierWarrantyNote: dto.supplierWarrantyNote ?? null,
      forbiddenCountries: dto.forbiddenCountries ?? null,
      invoiceName: dto.invoiceName ?? null,
      invoiceUnit: dto.invoiceUnit ?? null,
      invoiceModel: dto.invoiceModel ?? null,
      supplierName: dto.supplierName ?? null,
      companyId: dto.companyId ?? null,
      createdBy: operator,
      updatedBy: operator,
    });
  }

  async update(id: number, dto: UpdateSpuDto, operator?: string) {
    const spu = await this.repo.findById(id);
    if (!spu) throw new NotFoundException('SPU 不存在');

    let categoryLevel1Id = spu.categoryLevel1Id;
    let categoryLevel2Id = spu.categoryLevel2Id;

    if (dto.categoryId !== undefined && dto.categoryId !== spu.categoryId) {
      const category = await this.categoriesService.findById(dto.categoryId);
      if (category.level !== 3) throw new BadRequestException('只能选择三级（末级）分类');
      categoryLevel2Id = null;
      categoryLevel1Id = null;
      if (category.parentId) {
        const level2 = await this.categoriesService.findById(category.parentId).catch(() => null);
        if (level2) {
          categoryLevel2Id = level2.id;
          if (level2.parentId) {
            const level1 = await this.categoriesService.findById(level2.parentId).catch(() => null);
            if (level1) categoryLevel1Id = level1.id;
          }
        }
      }
    }

    return this.repo.update(id, { ...dto, categoryLevel1Id, categoryLevel2Id, updatedBy: operator });
  }

  async delete(id: number): Promise<void> {
    const spu = await this.repo.findById(id);
    if (!spu) throw new NotFoundException('SPU 不存在');
    await this.repo.delete(id);
  }
}
