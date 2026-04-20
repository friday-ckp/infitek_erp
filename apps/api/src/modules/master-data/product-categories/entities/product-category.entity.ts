import { Column, Entity, Index, Unique } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('product_categories')
@Index('idx_product_categories_parent_id', ['parentId'])
@Unique('idx_product_categories_name', ['name'])
export class ProductCategory extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 100 })
  @Expose()
  name: string;

  @Column({ name: 'name_en', type: 'varchar', length: 100, nullable: true })
  @Expose()
  nameEn: string | null;

  @Column({ name: 'code', type: 'varchar', length: 20, nullable: true })
  @Expose()
  code: string | null;

  @Column({ name: 'parent_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  parentId: number | null;

  @Column({ name: 'level', type: 'tinyint', unsigned: true })
  @Expose()
  level: number;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  @Expose()
  sortOrder: number;

  @Column({ name: 'purchase_owner', type: 'varchar', length: 100, nullable: true })
  @Expose()
  purchaseOwner: string | null;

  @Column({ name: 'product_owner', type: 'varchar', length: 100, nullable: true })
  @Expose()
  productOwner: string | null;
}
