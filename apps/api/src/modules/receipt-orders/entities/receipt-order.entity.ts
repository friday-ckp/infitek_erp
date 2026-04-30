import { Expose } from 'class-transformer';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { ReceiptOrderStatus, ReceiptOrderType } from '@infitek/shared';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { ReceiptOrderItem } from './receipt-order-item.entity';

@Entity('receipt_orders')
@Unique('uq_receipt_orders_receipt_code', ['receiptCode'])
@Index('idx_receipt_orders_purchase_order_id', ['purchaseOrderId'])
@Index('idx_receipt_orders_receipt_date', ['receiptDate'])
@Index('idx_receipt_orders_source_action_key', ['sourceActionKey'], {
  unique: true,
})
export class ReceiptOrder extends BaseEntity {
  @Column({ name: 'receipt_code', type: 'varchar', length: 40 })
  @Expose()
  receiptCode: string;

  @Column({ name: 'purchase_order_id', type: 'bigint', unsigned: true })
  @Expose()
  purchaseOrderId: number;

  @ManyToOne(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.receiptOrders, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder?: PurchaseOrder;

  @Column({ name: 'purchase_order_code', type: 'varchar', length: 40 })
  @Expose()
  purchaseOrderCode: string;

  @Column({ name: 'receipt_type', type: 'varchar', length: 40 })
  @Expose()
  receiptType: ReceiptOrderType;

  @Column({ name: 'status', type: 'varchar', length: 20 })
  @Expose()
  status: ReceiptOrderStatus;

  @Column({ name: 'warehouse_id', type: 'bigint', unsigned: true })
  @Expose()
  warehouseId: number;

  @Column({ name: 'warehouse_name', type: 'varchar', length: 200 })
  @Expose()
  warehouseName: string;

  @Column({ name: 'receipt_date', type: 'date' })
  @Expose()
  receiptDate: string;

  @Column({ name: 'receiver_id', type: 'bigint', unsigned: true })
  @Expose()
  receiverId: number;

  @Column({ name: 'receiver_name', type: 'varchar', length: 100 })
  @Expose()
  receiverName: string;

  @Column({
    name: 'shipping_demand_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  @Expose()
  shippingDemandId: number | null;

  @Column({
    name: 'shipping_demand_code',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  @Expose()
  shippingDemandCode: string | null;

  @Column({
    name: 'purchase_company_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  @Expose()
  purchaseCompanyId: number | null;

  @Column({
    name: 'purchase_company_name',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  @Expose()
  purchaseCompanyName: string | null;

  @Column({ name: 'total_quantity', type: 'int', default: 0 })
  @Expose()
  totalQuantity: number;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  @Expose()
  totalAmount: string;

  @Column({ name: 'remark', type: 'text', nullable: true })
  @Expose()
  remark: string | null;

  @Column({
    name: 'inventory_note',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  @Expose()
  inventoryNote: string | null;

  @Column({
    name: 'source_action_key',
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  @Expose()
  sourceActionKey: string | null;

  @OneToMany(() => ReceiptOrderItem, (item) => item.receiptOrder, {
    cascade: false,
  })
  @Expose()
  items?: ReceiptOrderItem[];
}
