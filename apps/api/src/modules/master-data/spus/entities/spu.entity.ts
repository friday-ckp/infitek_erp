import { Column, Entity, Index, Unique } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('spus')
@Unique('uq_spus_spu_code', ['spuCode'])
@Index('idx_spus_category_id', ['categoryId'])
@Index('idx_spus_name', ['name'])
export class Spu extends BaseEntity {
  @Column({ name: 'spu_code', type: 'varchar', length: 30 })
  @Expose()
  spuCode: string;

  @Column({ name: 'name', type: 'varchar', length: 200 })
  @Expose()
  name: string;

  @Column({ name: 'category_id', type: 'bigint', unsigned: true })
  @Expose()
  categoryId: number;

  @Column({ name: 'category_level1_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  categoryLevel1Id: number | null;

  @Column({ name: 'category_level2_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  categoryLevel2Id: number | null;

  @Column({ name: 'unit', type: 'varchar', length: 50, nullable: true })
  @Expose()
  unit: string | null;

  @Column({ name: 'manufacturer_model', type: 'varchar', length: 200, nullable: true })
  @Expose()
  manufacturerModel: string | null;

  @Column({ name: 'customer_warranty_months', type: 'int', unsigned: true, nullable: true })
  @Expose()
  customerWarrantyMonths: number | null;

  @Column({ name: 'purchase_warranty_months', type: 'int', unsigned: true, nullable: true })
  @Expose()
  purchaseWarrantyMonths: number | null;

  @Column({ name: 'supplier_warranty_note', type: 'text', nullable: true })
  @Expose()
  supplierWarrantyNote: string | null;

  @Column({ name: 'forbidden_countries', type: 'varchar', length: 500, nullable: true })
  @Expose()
  forbiddenCountries: string | null;

  @Column({ name: 'invoice_name', type: 'varchar', length: 200, nullable: true })
  @Expose()
  invoiceName: string | null;

  @Column({ name: 'invoice_unit', type: 'varchar', length: 50, nullable: true })
  @Expose()
  invoiceUnit: string | null;

  @Column({ name: 'invoice_model', type: 'varchar', length: 200, nullable: true })
  @Expose()
  invoiceModel: string | null;

  @Column({ name: 'supplier_name', type: 'varchar', length: 200, nullable: true })
  @Expose()
  supplierName: string | null;

  @Column({ name: 'company_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  companyId: number | null;

  @Column({ name: 'category_level1_code', type: 'varchar', length: 20, nullable: true })
  @Expose()
  categoryLevel1Code: string | null; // 一级分类编号（冗余，来自分类树）

  @Column({ name: 'category_level2_code', type: 'varchar', length: 20, nullable: true })
  @Expose()
  categoryLevel2Code: string | null; // 二级分类编号（冗余，来自分类树）

  @Column({ name: 'category_level3_code', type: 'varchar', length: 20, nullable: true })
  @Expose()
  categoryLevel3Code: string | null; // 三级分类编号（冗余，即选中分类的 code）
}
