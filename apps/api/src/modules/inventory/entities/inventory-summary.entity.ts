import { Column, Entity, Index, Unique } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('inventory_summary')
@Unique('uq_inventory_summary_sku_warehouse', ['skuId', 'warehouseId'])
@Index('idx_inventory_summary_sku_id', ['skuId'])
@Index('idx_inventory_summary_warehouse_id', ['warehouseId'])
export class InventorySummary extends BaseEntity {
  @Column({ name: 'sku_id', type: 'bigint', unsigned: true })
  @Expose()
  skuId: number;

  @Column({ name: 'warehouse_id', type: 'bigint', unsigned: true })
  @Expose()
  warehouseId: number;

  @Column({ name: 'actual_quantity', type: 'int', default: 0 })
  @Expose()
  actualQuantity: number;

  @Column({ name: 'locked_quantity', type: 'int', default: 0 })
  @Expose()
  lockedQuantity: number;

  @Column({ name: 'available_quantity', type: 'int', default: 0 })
  @Expose()
  availableQuantity: number;
}
