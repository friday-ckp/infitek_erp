import { Column, Entity, Index, Unique } from 'typeorm';
import { Expose } from 'class-transformer';
import { SkuStatus } from '@infitek/shared';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('skus')
@Unique('uq_skus_sku_code', ['skuCode'])
@Index('idx_skus_spu_id', ['spuId'])
@Index('idx_skus_hs_code', ['hsCode'])
export class Sku extends BaseEntity {
  @Column({ name: 'sku_code', type: 'varchar', length: 30 })
  @Expose()
  skuCode: string;

  @Column({ name: 'spu_id', type: 'bigint', unsigned: true })
  @Expose()
  spuId: number;

  @Column({ name: 'unit_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  unitId: number | null;

  // --- 产品基本 ---
  @Column({ name: 'name_cn', type: 'varchar', length: 200, nullable: true })
  @Expose()
  nameCn: string | null;

  @Column({ name: 'name_en', type: 'varchar', length: 200, nullable: true })
  @Expose()
  nameEn: string | null;

  @Column({ name: 'specification', type: 'varchar', length: 500 })
  @Expose()
  specification: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: SkuStatus.ACTIVE })
  @Expose()
  status: SkuStatus;

  @Column({ name: 'product_type', type: 'varchar', length: 100, nullable: true })
  @Expose()
  productType: string | null;

  @Column({ name: 'principle', type: 'varchar', length: 200, nullable: true })
  @Expose()
  principle: string | null;

  @Column({ name: 'product_usage', type: 'text', nullable: true })
  @Expose()
  productUsage: string | null;

  @Column({ name: 'core_params', type: 'text', nullable: true })
  @Expose()
  coreParams: string | null;

  @Column({ name: 'electrical_params', type: 'text', nullable: true })
  @Expose()
  electricalParams: string | null;

  @Column({ name: 'material', type: 'varchar', length: 200, nullable: true })
  @Expose()
  material: string | null;

  @Column({ name: 'has_plug', type: 'tinyint', width: 1, nullable: true })
  @Expose()
  hasPlug: boolean | null;

  @Column({ name: 'special_attributes', type: 'varchar', length: 500, nullable: true })
  @Expose()
  specialAttributes: string | null;

  @Column({ name: 'special_attributes_note', type: 'text', nullable: true })
  @Expose()
  specialAttributesNote: string | null;

  @Column({ name: 'customer_warranty_months', type: 'int', unsigned: true, nullable: true })
  @Expose()
  customerWarrantyMonths: number | null;

  @Column({ name: 'forbidden_countries', type: 'varchar', length: 500, nullable: true })
  @Expose()
  forbiddenCountries: string | null;

  // --- 重量体积 ---
  @Column({ name: 'weight_kg', type: 'decimal', precision: 10, scale: 3 })
  @Expose()
  weightKg: number;

  @Column({ name: 'gross_weight_kg', type: 'decimal', precision: 10, scale: 3, nullable: true })
  @Expose()
  grossWeightKg: number | null;

  @Column({ name: 'length_cm', type: 'decimal', precision: 10, scale: 2, nullable: true })
  @Expose()
  lengthCm: number | null;

  @Column({ name: 'width_cm', type: 'decimal', precision: 10, scale: 2, nullable: true })
  @Expose()
  widthCm: number | null;

  @Column({ name: 'height_cm', type: 'decimal', precision: 10, scale: 2, nullable: true })
  @Expose()
  heightCm: number | null;

  @Column({ name: 'volume_cbm', type: 'decimal', precision: 10, scale: 4 })
  @Expose()
  volumeCbm: number;

  // --- 包装 ---
  @Column({ name: 'packaging_type', type: 'varchar', length: 100, nullable: true })
  @Expose()
  packagingType: string | null;

  @Column({ name: 'packaging_qty', type: 'int', unsigned: true, nullable: true })
  @Expose()
  packagingQty: number | null;

  @Column({ name: 'packaging_info', type: 'text', nullable: true })
  @Expose()
  packagingInfo: string | null;

  // --- 报关 ---
  @Column({ name: 'hs_code', type: 'varchar', length: 20 })
  @Expose()
  hsCode: string;

  @Column({ name: 'customs_name_cn', type: 'varchar', length: 200 })
  @Expose()
  customsNameCn: string;

  @Column({ name: 'customs_name_en', type: 'varchar', length: 200 })
  @Expose()
  customsNameEn: string;

  @Column({ name: 'declared_value_ref', type: 'decimal', precision: 12, scale: 2, nullable: true })
  @Expose()
  declaredValueRef: number | null;

  @Column({ name: 'declaration_elements', type: 'text', nullable: true })
  @Expose()
  declarationElements: string | null;

  @Column({ name: 'is_inspection_required', type: 'tinyint', width: 1, nullable: true })
  @Expose()
  isInspectionRequired: boolean | null;

  @Column({ name: 'regulatory_conditions', type: 'varchar', length: 500, nullable: true })
  @Expose()
  regulatoryConditions: string | null;

  @Column({ name: 'tax_refund_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  @Expose()
  taxRefundRate: number | null;

  @Column({ name: 'customs_info_maintained', type: 'tinyint', width: 1, nullable: true })
  @Expose()
  customsInfoMaintained: boolean | null;

  // --- 图片 ---
  @Column({ name: 'product_image_url', type: 'varchar', length: 500, nullable: true })
  @Expose()
  productImageUrl: string | null;
}
