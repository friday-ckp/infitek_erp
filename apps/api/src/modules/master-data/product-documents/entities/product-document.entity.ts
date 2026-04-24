import { Column, Entity, Index } from 'typeorm';
import { Expose } from 'class-transformer';
import { ProductDocumentType, ProductDocumentAttributionType } from '@infitek/shared';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('product_documents')
@Index('idx_product_documents_type', ['documentType'])
@Index('idx_product_documents_attribution', ['attributionType'])
@Index('idx_product_documents_spu_id', ['spuId'])
@Index('idx_product_documents_category_l1', ['categoryLevel1Id'])
@Index('idx_product_documents_category_l2', ['categoryLevel2Id'])
@Index('idx_product_documents_category_l3', ['categoryLevel3Id'])
export class ProductDocument extends BaseEntity {
  @Column({ name: 'document_name', type: 'varchar', length: 200 })
  @Expose()
  documentName: string;

  @Column({ name: 'document_type', type: 'varchar', length: 50 })
  @Expose()
  documentType: ProductDocumentType;

  @Column({ name: 'content', type: 'longtext', nullable: true })
  @Expose()
  content: string | null;

  @Column({ name: 'attribution_type', type: 'varchar', length: 50 })
  @Expose()
  attributionType: ProductDocumentAttributionType;

  @Column({ name: 'country_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  countryId: number | null;

  @Column({ name: 'category_level1_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  categoryLevel1Id: number | null;

  @Column({ name: 'category_level2_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  categoryLevel2Id: number | null;

  @Column({ name: 'category_level3_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  categoryLevel3Id: number | null;

  @Column({ name: 'spu_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  spuId: number | null;

  @Column({ name: 'file_key', type: 'varchar', length: 500, nullable: true })
  @Expose()
  fileKey: string | null;

  @Column({ name: 'file_name', type: 'varchar', length: 200, nullable: true })
  @Expose()
  fileName: string | null;
}
