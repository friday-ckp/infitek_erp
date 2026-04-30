import { Expose } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { YesNo } from '@infitek/shared';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Sku } from '../../master-data/skus/entities/sku.entity';
import { ShippingDemandItem } from '../../shipping-demands/entities/shipping-demand-item.entity';
import { ShippingDemand } from '../../shipping-demands/entities/shipping-demand.entity';
import { PurchaseOrder } from './purchase-order.entity';

@Entity('purchase_order_items')
@Index('idx_purchase_order_items_order_id', ['purchaseOrderId'])
@Index('idx_purchase_order_items_demand_item_id', ['shippingDemandItemId'])
@Index('idx_purchase_order_items_sku_id', ['skuId'])
export class PurchaseOrderItem extends BaseEntity {
  @Column({ name: 'purchase_order_id', type: 'bigint', unsigned: true })
  @Expose()
  purchaseOrderId: number;

  @ManyToOne(() => PurchaseOrder, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder?: PurchaseOrder;

  @Column({
    name: 'shipping_demand_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  @Expose()
  shippingDemandId: number | null;

  @ManyToOne(() => ShippingDemand, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'shipping_demand_id' })
  shippingDemand?: ShippingDemand;

  @Column({
    name: 'shipping_demand_item_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  @Expose()
  shippingDemandItemId: number | null;

  @ManyToOne(() => ShippingDemandItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'shipping_demand_item_id' })
  shippingDemandItem?: ShippingDemandItem;

  @Column({
    name: 'sales_order_item_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  @Expose()
  salesOrderItemId: number | null;

  @Column({ name: 'sku_id', type: 'bigint', unsigned: true })
  @Expose()
  skuId: number;

  @ManyToOne(() => Sku, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sku_id' })
  sku?: Sku;

  @Column({ name: 'sku_code', type: 'varchar', length: 100 })
  @Expose()
  skuCode: string;

  @Column({
    name: 'product_name_cn',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Expose()
  productNameCn: string | null;

  @Column({
    name: 'product_name_en',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Expose()
  productNameEn: string | null;

  @Column({
    name: 'product_type',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  @Expose()
  productType: string | null;

  @Column({
    name: 'manufacturer_model',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  @Expose()
  manufacturerModel: string | null;

  @Column({ name: 'plug_type', type: 'varchar', length: 50, nullable: true })
  @Expose()
  plugType: string | null;

  @Column({
    name: 'sku_specification',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Expose()
  skuSpecification: string | null;

  @Column({ name: 'unit_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  unitId: number | null;

  @Column({ name: 'unit_name', type: 'varchar', length: 50, nullable: true })
  @Expose()
  unitName: string | null;

  @Column({
    name: 'list_price',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  @Expose()
  listPrice: string | null;

  @Column({ name: 'is_invoiced', type: 'varchar', length: 10, nullable: true })
  @Expose()
  isInvoiced: YesNo | null;

  @Column({ name: 'quantity', type: 'int', default: 0 })
  @Expose()
  quantity: number;

  @Column({ name: 'received_quantity', type: 'int', default: 0 })
  @Expose()
  receivedQuantity: number;

  @Column({
    name: 'is_fully_received',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  @Expose()
  isFullyReceived: YesNo | null;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  @Expose()
  unitPrice: string;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  @Expose()
  amount: string;

  @Column({ name: 'spu_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  spuId: number | null;

  @Column({ name: 'spu_name', type: 'varchar', length: 255, nullable: true })
  @Expose()
  spuName: string | null;

  @Column({ name: 'electrical_params', type: 'text', nullable: true })
  @Expose()
  electricalParams: string | null;

  @Column({ name: 'core_params', type: 'text', nullable: true })
  @Expose()
  coreParams: string | null;

  @Column({
    name: 'has_plug_text',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  @Expose()
  hasPlugText: string | null;

  @Column({ name: 'special_attribute_note', type: 'text', nullable: true })
  @Expose()
  specialAttributeNote: string | null;
}
