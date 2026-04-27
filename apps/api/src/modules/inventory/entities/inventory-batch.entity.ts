import { Column, Entity, Index } from 'typeorm';
import { Expose } from 'class-transformer';
import { InventoryBatchSourceType } from '@infitek/shared';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('inventory_batch')
@Index('idx_inventory_batch_sku_id', ['skuId'])
@Index('idx_inventory_batch_warehouse_id', ['warehouseId'])
@Index('idx_inventory_batch_source', ['sourceType', 'sourceDocumentId'])
@Index('idx_inventory_batch_fifo', ['skuId', 'warehouseId', 'receiptDate', 'id'])
export class InventoryBatch extends BaseEntity {
  @Column({ name: 'sku_id', type: 'bigint', unsigned: true })
  @Expose()
  skuId: number;

  @Column({ name: 'warehouse_id', type: 'bigint', unsigned: true })
  @Expose()
  warehouseId: number;

  @Column({ name: 'batch_quantity', type: 'int', default: 0 })
  @Expose()
  batchQuantity: number;

  @Column({ name: 'batch_locked_quantity', type: 'int', default: 0 })
  @Expose()
  batchLockedQuantity: number;

  @Column({ name: 'source_type', type: 'varchar', length: 40 })
  @Expose()
  sourceType: InventoryBatchSourceType;

  @Column({ name: 'source_document_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  sourceDocumentId: number | null;

  @Column({ name: 'receipt_date', type: 'date' })
  @Expose()
  receiptDate: string;
}
