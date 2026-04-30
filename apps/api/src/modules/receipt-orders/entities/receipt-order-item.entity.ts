import { Expose } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../../purchase-orders/entities/purchase-order-item.entity';
import { ShippingDemandItem } from '../../shipping-demands/entities/shipping-demand-item.entity';
import { ReceiptOrder } from './receipt-order.entity';

@Entity('receipt_order_items')
@Index('idx_receipt_order_items_receipt_order_id', ['receiptOrderId'])
@Index('idx_receipt_order_items_purchase_order_item_id', ['purchaseOrderItemId'])
@Index('idx_receipt_order_items_sku_id', ['skuId'])
@Index('idx_receipt_order_items_warehouse_id', ['warehouseId'])
export class ReceiptOrderItem extends BaseEntity {
  @Column({ name: 'receipt_order_id', type: 'bigint', unsigned: true })
  @Expose()
  receiptOrderId: number;

  @ManyToOne(() => ReceiptOrder, (receiptOrder) => receiptOrder.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receipt_order_id' })
  receiptOrder?: ReceiptOrder;

  @Column({ name: 'purchase_order_id', type: 'bigint', unsigned: true })
  @Expose()
  purchaseOrderId: number;

  @ManyToOne(() => PurchaseOrder, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder?: PurchaseOrder;

  @Column({ name: 'purchase_order_item_id', type: 'bigint', unsigned: true })
  @Expose()
  purchaseOrderItemId: number;

  @ManyToOne(() => PurchaseOrderItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'purchase_order_item_id' })
  purchaseOrderItem?: PurchaseOrderItem;

  @Column({
    name: 'shipping_demand_item_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  @Expose()
  shippingDemandItemId: number | null;

  @ManyToOne(() => ShippingDemandItem, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'shipping_demand_item_id' })
  shippingDemandItem?: ShippingDemandItem;

  @Column({ name: 'sku_id', type: 'bigint', unsigned: true })
  @Expose()
  skuId: number;

  @Column({ name: 'sku_code', type: 'varchar', length: 100 })
  @Expose()
  skuCode: string;

  @Column({
    name: 'product_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Expose()
  productName: string | null;

  @Column({
    name: 'product_category_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Expose()
  productCategoryName: string | null;

  @Column({ name: 'received_quantity', type: 'int', default: 0 })
  @Expose()
  receivedQuantity: number;

  @Column({ name: 'qc_image_keys', type: 'json', nullable: true })
  @Expose()
  qcImageKeys: string[] | null;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  @Expose()
  unitPrice: string;

  @Column({ name: 'warehouse_id', type: 'bigint', unsigned: true })
  @Expose()
  warehouseId: number;

  @Column({ name: 'warehouse_name', type: 'varchar', length: 200 })
  @Expose()
  warehouseName: string;

  @Column({
    name: 'inventory_batch_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  @Expose()
  inventoryBatchId: number | null;
}
