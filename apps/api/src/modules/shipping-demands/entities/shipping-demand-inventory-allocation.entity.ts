import { Expose } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ShippingDemandAllocationStatus } from '@infitek/shared';
import { BaseEntity } from '../../../common/entities/base.entity';
import { InventoryBatch } from '../../inventory/entities/inventory-batch.entity';
import { ShippingDemandItem } from './shipping-demand-item.entity';
import { ShippingDemand } from './shipping-demand.entity';

@Entity('shipping_demand_inventory_allocations')
@Index('idx_sd_allocations_demand_id', ['shippingDemandId'])
@Index('idx_sd_allocations_item_id', ['shippingDemandItemId'])
@Index('idx_sd_allocations_sku_warehouse', ['skuId', 'warehouseId'])
@Index('idx_sd_allocations_batch_id', ['inventoryBatchId'])
@Index('idx_sd_allocations_status', ['status'])
@Index('uq_sd_allocations_action_batch', ['sourceActionKey', 'inventoryBatchId'], {
  unique: true,
})
export class ShippingDemandInventoryAllocation extends BaseEntity {
  @Column({ name: 'shipping_demand_id', type: 'bigint', unsigned: true })
  @Expose()
  shippingDemandId: number;

  @ManyToOne(() => ShippingDemand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shipping_demand_id' })
  shippingDemand?: ShippingDemand;

  @Column({ name: 'shipping_demand_item_id', type: 'bigint', unsigned: true })
  @Expose()
  shippingDemandItemId: number;

  @ManyToOne(() => ShippingDemandItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shipping_demand_item_id' })
  shippingDemandItem?: ShippingDemandItem;

  @Column({ name: 'sales_order_item_id', type: 'bigint', unsigned: true })
  @Expose()
  salesOrderItemId: number;

  @Column({ name: 'sku_id', type: 'bigint', unsigned: true })
  @Expose()
  skuId: number;

  @Column({ name: 'warehouse_id', type: 'bigint', unsigned: true })
  @Expose()
  warehouseId: number;

  @Column({ name: 'inventory_batch_id', type: 'bigint', unsigned: true })
  @Expose()
  inventoryBatchId: number;

  @ManyToOne(() => InventoryBatch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inventory_batch_id' })
  inventoryBatch?: InventoryBatch;

  @Column({ name: 'lock_source', type: 'varchar', length: 40 })
  @Expose()
  lockSource: string;

  @Column({ name: 'source_document_type', type: 'varchar', length: 40 })
  @Expose()
  sourceDocumentType: string;

  @Column({ name: 'source_document_id', type: 'bigint', unsigned: true })
  @Expose()
  sourceDocumentId: number;

  @Column({ name: 'original_locked_quantity', type: 'int', default: 0 })
  @Expose()
  originalLockedQuantity: number;

  @Column({ name: 'locked_quantity', type: 'int', default: 0 })
  @Expose()
  lockedQuantity: number;

  @Column({ name: 'shipped_quantity', type: 'int', default: 0 })
  @Expose()
  shippedQuantity: number;

  @Column({ name: 'released_quantity', type: 'int', default: 0 })
  @Expose()
  releasedQuantity: number;

  @Column({ name: 'status', type: 'varchar', length: 20 })
  @Expose()
  status: ShippingDemandAllocationStatus;

  @Column({ name: 'source_action_key', type: 'varchar', length: 120 })
  @Expose()
  sourceActionKey: string;
}
