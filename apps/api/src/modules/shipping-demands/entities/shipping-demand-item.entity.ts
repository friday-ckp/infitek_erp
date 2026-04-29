import { Expose } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { FulfillmentType, PlugType, ProductLineType, YesNo } from '@infitek/shared';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SalesOrderItem } from '../../sales-orders/entities/sales-order-item.entity';
import { ShippingDemand } from './shipping-demand.entity';

@Entity('shipping_demand_items')
@Index('idx_shipping_demand_items_demand_id', ['shippingDemandId'])
@Index('idx_shipping_demand_items_sales_order_item_id', ['salesOrderItemId'])
@Index('idx_shipping_demand_items_sku_id', ['skuId'])
export class ShippingDemandItem extends BaseEntity {
  @Column({ name: 'shipping_demand_id', type: 'bigint' })
  @Expose()
  shippingDemandId: number;

  @ManyToOne(() => ShippingDemand, (demand) => demand.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shipping_demand_id' })
  shippingDemand?: ShippingDemand;

  @Column({ name: 'sales_order_item_id', type: 'bigint' })
  @Expose()
  salesOrderItemId: number;

  @ManyToOne(() => SalesOrderItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sales_order_item_id' })
  salesOrderItem?: SalesOrderItem;

  @Column({ name: 'sku_id', type: 'bigint' })
  @Expose()
  skuId: number;

  @Column({ name: 'sku_code', type: 'varchar', length: 100 })
  @Expose()
  skuCode: string;

  @Column({ name: 'product_name_cn', type: 'varchar', length: 255, nullable: true })
  @Expose()
  productNameCn: string | null;

  @Column({ name: 'product_name_en', type: 'varchar', length: 255, nullable: true })
  @Expose()
  productNameEn: string | null;

  @Column({ name: 'line_type', type: 'varchar', length: 20, nullable: true })
  @Expose()
  lineType: ProductLineType | null;

  @Column({ name: 'spu_id', type: 'bigint', nullable: true })
  @Expose()
  spuId: number | null;

  @Column({ name: 'spu_name', type: 'varchar', length: 255, nullable: true })
  @Expose()
  spuName: string | null;

  @Column({ name: 'electrical_params', type: 'text', nullable: true })
  @Expose()
  electricalParams: string | null;

  @Column({ name: 'has_plug', type: 'varchar', length: 10, nullable: true })
  @Expose()
  hasPlug: YesNo | null;

  @Column({ name: 'plug_type', type: 'varchar', length: 20, nullable: true })
  @Expose()
  plugType: PlugType | null;

  @Column({ name: 'unit_price', type: 'decimal', precision: 18, scale: 2, default: 0 })
  @Expose()
  unitPrice: string;

  @Column({ name: 'currency_id', type: 'bigint', nullable: true })
  @Expose()
  currencyId: number | null;

  @Column({ name: 'currency_code', type: 'varchar', length: 20, nullable: true })
  @Expose()
  currencyCode: string | null;

  @Column({ name: 'unit_id', type: 'bigint', nullable: true })
  @Expose()
  unitId: number | null;

  @Column({ name: 'unit_name', type: 'varchar', length: 50, nullable: true })
  @Expose()
  unitName: string | null;

  @Column({ name: 'purchaser_id', type: 'bigint', nullable: true })
  @Expose()
  purchaserId: number | null;

  @Column({ name: 'purchaser_name', type: 'varchar', length: 100, nullable: true })
  @Expose()
  purchaserName: string | null;

  @Column({ name: 'needs_purchase', type: 'varchar', length: 10, nullable: true })
  @Expose()
  needsPurchase: YesNo | null;

  @Column({ name: 'required_quantity', type: 'int', default: 0 })
  @Expose()
  requiredQuantity: number;

  @Column({ name: 'available_stock_snapshot', type: 'json', nullable: true })
  @Expose()
  availableStockSnapshot: Array<{
    skuId: number;
    warehouseId: number | null;
    actualQuantity: number;
    lockedQuantity: number;
    availableQuantity: number;
  }> | null;

  @Column({ name: 'fulfillment_type', type: 'varchar', length: 30, nullable: true })
  @Expose()
  fulfillmentType: FulfillmentType | null;

  @Column({ name: 'stock_required_quantity', type: 'int', default: 0 })
  @Expose()
  stockRequiredQuantity: number;

  @Column({ name: 'purchase_required_quantity', type: 'int', default: 0 })
  @Expose()
  purchaseRequiredQuantity: number;

  @Column({ name: 'locked_remaining_quantity', type: 'int', default: 0 })
  @Expose()
  lockedRemainingQuantity: number;

  @Column({ name: 'shipped_quantity', type: 'int', default: 0 })
  @Expose()
  shippedQuantity: number;

  @Column({ name: 'purchase_ordered_quantity', type: 'int', default: 0 })
  @Expose()
  purchaseOrderedQuantity: number;

  @Column({ name: 'received_quantity', type: 'int', default: 0 })
  @Expose()
  receivedQuantity: number;

  @Column({ name: 'amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  @Expose()
  amount: string;

  @Column({ name: 'material', type: 'varchar', length: 255, nullable: true })
  @Expose()
  material: string | null;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  @Expose()
  imageUrl: string | null;

  @Column({ name: 'total_volume_cbm', type: 'decimal', precision: 18, scale: 4, default: 0 })
  @Expose()
  totalVolumeCbm: string;

  @Column({ name: 'total_weight_kg', type: 'decimal', precision: 18, scale: 4, default: 0 })
  @Expose()
  totalWeightKg: string;

  @Column({ name: 'unit_weight_kg', type: 'decimal', precision: 18, scale: 4, default: 0 })
  @Expose()
  unitWeightKg: string;

  @Column({ name: 'unit_volume_cbm', type: 'decimal', precision: 18, scale: 4, default: 0 })
  @Expose()
  unitVolumeCbm: string;

  @Column({ name: 'sku_specification', type: 'varchar', length: 255, nullable: true })
  @Expose()
  skuSpecification: string | null;
}
