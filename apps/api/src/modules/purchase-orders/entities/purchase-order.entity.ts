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
import { PurchaseOrderStatus, PurchaseOrderType } from '@infitek/shared';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ContractTemplate } from '../../master-data/contract-templates/entities/contract-template.entity';
import { Supplier } from '../../master-data/suppliers/entities/supplier.entity';
import { ShippingDemand } from '../../shipping-demands/entities/shipping-demand.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';

@Entity('purchase_orders')
@Unique('uq_purchase_orders_po_code', ['poCode'])
@Index('idx_purchase_orders_supplier_id', ['supplierId'])
@Index('idx_purchase_orders_shipping_demand_id', ['shippingDemandId'])
@Index('idx_purchase_orders_status', ['status'])
@Index('idx_purchase_orders_source_action_key', ['sourceActionKey'], {
  unique: true,
})
export class PurchaseOrder extends BaseEntity {
  @Column({ name: 'po_code', type: 'varchar', length: 40 })
  @Expose()
  poCode: string;

  @Column({ name: 'supplier_id', type: 'bigint', unsigned: true })
  @Expose()
  supplierId: number;

  @ManyToOne(() => Supplier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier?: Supplier;

  @Column({ name: 'supplier_name', type: 'varchar', length: 200 })
  @Expose()
  supplierName: string;

  @Column({
    name: 'supplier_contact_person',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  @Expose()
  supplierContactPerson: string | null;

  @Column({
    name: 'supplier_contact_phone',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  @Expose()
  supplierContactPhone: string | null;

  @Column({
    name: 'supplier_contact_email',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  @Expose()
  supplierContactEmail: string | null;

  @Column({
    name: 'supplier_payment_term_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  @Expose()
  supplierPaymentTermName: string | null;

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
    name: 'shipping_demand_code',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  @Expose()
  shippingDemandCode: string | null;

  @Column({
    name: 'sales_order_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  @Expose()
  salesOrderId: number | null;

  @Column({
    name: 'sales_order_code',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  @Expose()
  salesOrderCode: string | null;

  @Column({
    name: 'contract_term_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  @Expose()
  contractTermId: number | null;

  @ManyToOne(() => ContractTemplate, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contract_term_id' })
  contractTerm?: ContractTemplate;

  @Column({
    name: 'contract_term_name',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  @Expose()
  contractTermName: string | null;

  @Column({ name: 'order_type', type: 'varchar', length: 30 })
  @Expose()
  orderType: PurchaseOrderType;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  @Expose()
  status: PurchaseOrderStatus;

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
    name: 'source_action_key',
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  @Expose()
  sourceActionKey: string | null;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, {
    cascade: false,
  })
  @Expose()
  items?: PurchaseOrderItem[];
}
