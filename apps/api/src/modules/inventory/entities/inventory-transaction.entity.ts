import { Expose } from 'class-transformer';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { InventoryChangeType } from '@infitek/shared';

@Entity('inventory_transactions')
@Index('idx_inventory_transactions_sku_warehouse', ['skuId', 'warehouseId'])
@Index('idx_inventory_transactions_change_type', ['changeType'])
@Index('idx_inventory_transactions_source', ['sourceDocumentType', 'sourceDocumentId'])
@Index('uq_inventory_transactions_action_key', ['sourceActionKey'], { unique: true })
@Index('idx_inventory_transactions_created_at', ['operatedAt'])
export class InventoryTransaction {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  @Expose()
  id: number;

  @Column({ name: 'sku_id', type: 'bigint', unsigned: true })
  @Expose()
  skuId: number;

  @Column({ name: 'warehouse_id', type: 'bigint', unsigned: true })
  @Expose()
  warehouseId: number;

  @Column({ name: 'inventory_batch_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  inventoryBatchId: number | null;

  @Column({ name: 'change_type', type: 'varchar', length: 30 })
  @Expose()
  changeType: InventoryChangeType;

  @Column({ name: 'actual_quantity_delta', type: 'int', default: 0 })
  @Expose()
  actualQuantityDelta: number;

  @Column({ name: 'locked_quantity_delta', type: 'int', default: 0 })
  @Expose()
  lockedQuantityDelta: number;

  @Column({ name: 'available_quantity_delta', type: 'int', default: 0 })
  @Expose()
  availableQuantityDelta: number;

  @Column({ name: 'before_actual_quantity', type: 'int', default: 0 })
  @Expose()
  beforeActualQuantity: number;

  @Column({ name: 'after_actual_quantity', type: 'int', default: 0 })
  @Expose()
  afterActualQuantity: number;

  @Column({ name: 'before_locked_quantity', type: 'int', default: 0 })
  @Expose()
  beforeLockedQuantity: number;

  @Column({ name: 'after_locked_quantity', type: 'int', default: 0 })
  @Expose()
  afterLockedQuantity: number;

  @Column({ name: 'before_available_quantity', type: 'int', default: 0 })
  @Expose()
  beforeAvailableQuantity: number;

  @Column({ name: 'after_available_quantity', type: 'int', default: 0 })
  @Expose()
  afterAvailableQuantity: number;

  @Column({ name: 'source_document_type', type: 'varchar', length: 40 })
  @Expose()
  sourceDocumentType: string;

  @Column({ name: 'source_document_id', type: 'bigint', unsigned: true })
  @Expose()
  sourceDocumentId: number;

  @Column({ name: 'source_document_item_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  sourceDocumentItemId: number | null;

  @Column({ name: 'source_action_key', type: 'varchar', length: 160 })
  @Expose()
  sourceActionKey: string;

  @Column({ name: 'operated_by', type: 'varchar', length: 100, nullable: true })
  @Expose()
  operatedBy: string | null;

  @CreateDateColumn({ name: 'operated_at' })
  @Expose()
  operatedAt: Date;
}
