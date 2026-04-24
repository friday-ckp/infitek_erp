import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductDocumentsRepository } from './product-documents.repository';
import { FilesService } from '../../../files/files.service';
import { SpusService } from '../spus/spus.service';
import { CountriesService } from '../countries/countries.service';
import { ProductCategoriesService } from '../product-categories/product-categories.service';
import { CreateProductDocumentDto } from './dto/create-product-document.dto';
import { UpdateProductDocumentDto } from './dto/update-product-document.dto';
import { QueryProductDocumentDto } from './dto/query-product-document.dto';
import { ProductDocumentAttributionType } from '@infitek/shared';

@Injectable()
export class ProductDocumentsService {
  constructor(
    private readonly repo: ProductDocumentsRepository,
    private readonly filesService: FilesService,
    private readonly spusService: SpusService,
    private readonly countriesService: CountriesService,
    private readonly productCategoriesService: ProductCategoriesService,
  ) {}

  private normalizeScope(dto: {
    categoryLevel1Id?: number | null;
    categoryLevel2Id?: number | null;
    categoryLevel3Id?: number | null;
    spuId?: number | null;
  }) {
    return {
      categoryLevel1Id: dto.categoryLevel1Id ?? null,
      categoryLevel2Id: dto.categoryLevel2Id ?? null,
      categoryLevel3Id: dto.categoryLevel3Id ?? null,
      spuId: dto.spuId ?? null,
    };
  }

  private async validateCountry(countryId: number | null): Promise<void> {
    if (countryId !== null) {
      const country = await this.countriesService.findById(countryId);
      if (!country) {
        throw new NotFoundException(`国家/地区 ${countryId} 不存在`);
      }
    }
  }

  private async validateAttribution(
    attributionType: ProductDocumentAttributionType,
    scope: {
      categoryLevel1Id: number | null;
      categoryLevel2Id: number | null;
      categoryLevel3Id: number | null;
      spuId: number | null;
    },
  ): Promise<void> {
    const selectedCount = [
      scope.categoryLevel1Id,
      scope.categoryLevel2Id,
      scope.categoryLevel3Id,
      scope.spuId,
    ].filter((value) => value !== null).length;

    const requireOnlyOne = async (
      value: number | null,
      expectedLevel: number | null,
      missingMessage: string,
      extraMessage: string,
    ) => {
      if (value === null) {
        throw new BadRequestException(missingMessage);
      }
      if (selectedCount !== 1) {
        throw new BadRequestException(extraMessage);
      }
      if (expectedLevel !== null) {
        const category = await this.productCategoriesService.findById(value);
        if (!category) {
          throw new NotFoundException(`产品分类 ${value} 不存在`);
        }
        if (category.level !== expectedLevel) {
          throw new BadRequestException(`所选分类必须为 ${expectedLevel} 级分类`);
        }
      }
    };

    if (attributionType === ProductDocumentAttributionType.GENERAL) {
      if (selectedCount > 0) {
        throw new BadRequestException('通用归属不能同时关联分类或产品');
      }
      return;
    }

    if (attributionType === ProductDocumentAttributionType.CATEGORY_L1) {
      await requireOnlyOne(
        scope.categoryLevel1Id,
        1,
        '产品一级分类归属必须选择一级分类',
        '产品一级分类归属只能选择一个一级分类',
      );
      return;
    }

    if (attributionType === ProductDocumentAttributionType.CATEGORY_L2) {
      await requireOnlyOne(
        scope.categoryLevel2Id,
        2,
        '产品二级分类归属必须选择二级分类',
        '产品二级分类归属只能选择一个二级分类',
      );
      return;
    }

    if (attributionType === ProductDocumentAttributionType.CATEGORY_L3) {
      await requireOnlyOne(
        scope.categoryLevel3Id,
        3,
        '产品三级分类归属必须选择三级分类',
        '产品三级分类归属只能选择一个三级分类',
      );
      return;
    }

    if (scope.spuId === null) {
      throw new BadRequestException('产品归属必须选择所属产品');
    }
    if (selectedCount !== 1) {
      throw new BadRequestException('产品归属只能选择一个所属产品');
    }
    const spu = await this.spusService.findById(scope.spuId);
    if (!spu) {
      throw new NotFoundException(`SPU ${scope.spuId} 不存在`);
    }
  }

  private async withFileUrl<T extends { fileKey: string | null }>(
    item: T,
  ): Promise<T & { fileUrl: string | null }> {
    const fileUrl = item.fileKey ? await this.filesService.getSignedUrl(item.fileKey) : null;
    return { ...item, fileUrl };
  }

  async findAll(query: QueryProductDocumentDto) {
    const result = await this.repo.findAll(query);
    const list = await Promise.all(result.list.map((d) => this.withFileUrl(d)));
    return { ...result, list };
  }

  async findById(id: number) {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException('资料不存在');
    return this.withFileUrl(doc);
  }

  async create(dto: CreateProductDocumentDto, operator?: string) {
    await this.validateCountry(dto.countryId ?? null);
    await this.validateAttribution(dto.attributionType, this.normalizeScope(dto));

    const entity = this.repo.create({
      documentName: dto.documentName,
      documentType: dto.documentType,
      content: dto.content ?? null,
      attributionType: dto.attributionType,
      countryId: dto.countryId ?? null,
      categoryLevel1Id: dto.categoryLevel1Id ?? null,
      categoryLevel2Id: dto.categoryLevel2Id ?? null,
      categoryLevel3Id: dto.categoryLevel3Id ?? null,
      spuId: dto.spuId ?? null,
      fileKey: dto.fileKey ?? null,
      fileName: dto.fileName ?? null,
      createdBy: operator,
      updatedBy: operator,
    });

    const saved = await this.repo.save(entity);
    return this.withFileUrl(saved);
  }

  async update(id: number, dto: UpdateProductDocumentDto, operator?: string) {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException('资料不存在');
    const previousFileKey = doc.fileKey;

    const nextState = {
      documentName: dto.documentName ?? doc.documentName,
      documentType: dto.documentType ?? doc.documentType,
      content: 'content' in dto ? dto.content ?? null : doc.content,
      attributionType: dto.attributionType ?? doc.attributionType,
      countryId: 'countryId' in dto ? dto.countryId ?? null : doc.countryId,
      categoryLevel1Id: 'categoryLevel1Id' in dto ? dto.categoryLevel1Id ?? null : doc.categoryLevel1Id,
      categoryLevel2Id: 'categoryLevel2Id' in dto ? dto.categoryLevel2Id ?? null : doc.categoryLevel2Id,
      categoryLevel3Id: 'categoryLevel3Id' in dto ? dto.categoryLevel3Id ?? null : doc.categoryLevel3Id,
      spuId: 'spuId' in dto ? dto.spuId ?? null : doc.spuId,
      fileKey: 'fileKey' in dto ? dto.fileKey ?? null : doc.fileKey,
      fileName: 'fileName' in dto ? dto.fileName ?? null : doc.fileName,
    };

    await this.validateCountry(nextState.countryId);
    await this.validateAttribution(nextState.attributionType, this.normalizeScope(nextState));

    doc.documentName = nextState.documentName;
    doc.documentType = nextState.documentType;
    doc.content = nextState.content;
    doc.attributionType = nextState.attributionType;
    doc.countryId = nextState.countryId;
    doc.categoryLevel1Id = nextState.categoryLevel1Id;
    doc.categoryLevel2Id = nextState.categoryLevel2Id;
    doc.categoryLevel3Id = nextState.categoryLevel3Id;
    doc.spuId = nextState.spuId;
    doc.fileKey = nextState.fileKey;
    doc.fileName = nextState.fileName;
    if (operator !== undefined) doc.updatedBy = operator;

    const saved = await this.repo.save(doc);
    if (previousFileKey && previousFileKey !== saved.fileKey) {
      await this.filesService.delete(previousFileKey);
    }
    return this.withFileUrl(saved);
  }

  async delete(id: number): Promise<void> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException('资料不存在');
    if (doc.fileKey) await this.filesService.delete(doc.fileKey);
    await this.repo.delete(id);
  }
}
