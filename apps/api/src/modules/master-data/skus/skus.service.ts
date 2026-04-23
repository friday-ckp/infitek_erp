import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { SkuStatus } from '@infitek/shared';
import { SkusRepository } from './skus.repository';
import { SpusService } from '../spus/spus.service';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import { QuerySkuDto } from './dto/query-sku.dto';
import { Sku } from './entities/sku.entity';

@Injectable()
export class SkusService {
  constructor(
    private readonly repo: SkusRepository,
    private readonly spusService: SpusService,
  ) {}

  async findAll(query: QuerySkuDto) {
    return this.repo.findAll(query);
  }

  async findById(id: number): Promise<Sku> {
    const sku = await this.repo.findById(id);
    if (!sku) throw new NotFoundException('SKU 不存在');
    return sku;
  }

  async create(dto: CreateSkuDto, operator?: string): Promise<Sku> {
    const spu = await this.spusService.findById(dto.spuId);
    if (!spu) throw new NotFoundException('SPU 不存在');

    try {
      return await this.repo.create({
        skuCode: dto.skuCode,
        spuId: dto.spuId,
        unitId: dto.unitId ?? null,
        nameCn: dto.nameCn ?? null,
        nameEn: dto.nameEn ?? null,
        specification: dto.specification,
        status: dto.status ?? SkuStatus.ON_SHELF,
        productType: dto.productType ?? null,
        productModel: dto.productModel ?? null,
        accessoryParentSkuId: dto.accessoryParentSkuId ?? null,
        categoryLevel1Id: dto.categoryLevel1Id ?? null,
        categoryLevel2Id: dto.categoryLevel2Id ?? null,
        categoryLevel3Id: dto.categoryLevel3Id ?? null,
        principle: dto.principle ?? null,
        productUsage: dto.productUsage ?? null,
        coreParams: dto.coreParams ?? null,
        electricalParams: dto.electricalParams ?? null,
        material: dto.material ?? null,
        hasPlug: dto.hasPlug ?? null,
        specialAttributes: dto.specialAttributes ?? null,
        specialAttributesNote: dto.specialAttributesNote ?? null,
        customerWarrantyMonths: dto.customerWarrantyMonths ?? null,
        forbiddenCountries: dto.forbiddenCountries ?? null,
        weightKg: dto.weightKg,
        grossWeightKg: dto.grossWeightKg ?? null,
        lengthCm: dto.lengthCm ?? null,
        widthCm: dto.widthCm ?? null,
        heightCm: dto.heightCm ?? null,
        volumeCbm: dto.volumeCbm,
        packagingType: dto.packagingType ?? null,
        packagingQty: dto.packagingQty ?? null,
        packagingInfo: dto.packagingInfo ?? null,
        packagingList: dto.packagingList ?? null,
        hsCode: dto.hsCode,
        customsNameCn: dto.customsNameCn,
        customsNameEn: dto.customsNameEn,
        declaredValueRef: dto.declaredValueRef ?? null,
        declarationElements: dto.declarationElements ?? null,
        isInspectionRequired: dto.isInspectionRequired ?? null,
        regulatoryConditions: dto.regulatoryConditions ?? null,
        taxRefundRate: dto.taxRefundRate ?? null,
        customsInfoMaintained: dto.customsInfoMaintained ?? null,
        productImageUrl: dto.productImageUrl ?? null,
        productImageUrls: dto.productImageUrls ?? null,
        createdBy: operator,
        updatedBy: operator,
      });
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(`SKU 编码 "${dto.skuCode}" 已存在，请使用其他编码`);
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateSkuDto, operator?: string): Promise<Sku> {
    const sku = await this.repo.findById(id);
    if (!sku) throw new NotFoundException('SKU 不存在');

    if (dto.spuId !== undefined && dto.spuId !== sku.spuId) {
      const spu = await this.spusService.findById(dto.spuId);
      if (!spu) throw new NotFoundException('SPU 不存在');
    }

    return this.repo.update(id, { ...dto, updatedBy: operator });
  }

  async delete(id: number): Promise<void> {
    const sku = await this.repo.findById(id);
    if (!sku) throw new NotFoundException('SKU 不存在');
    await this.repo.delete(id);
  }
}
