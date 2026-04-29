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
import {
  BlType,
  DomesticTradeType,
  InvoiceType,
  LogisticsOrderStatus,
  TransportationMethod,
  YesNo,
} from '@infitek/shared';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ShippingDemand } from '../../shipping-demands/entities/shipping-demand.entity';
import { LogisticsOrderItem } from './logistics-order-item.entity';
import { LogisticsOrderPackage } from './logistics-order-package.entity';

@Entity('logistics_orders')
@Unique('uq_logistics_orders_order_code', ['orderCode'])
@Index('idx_logistics_orders_shipping_demand_id', ['shippingDemandId'])
@Index('idx_logistics_orders_sales_order_id', ['salesOrderId'])
@Index('idx_logistics_orders_status', ['status'])
@Index('idx_logistics_orders_provider_id', ['logisticsProviderId'])
export class LogisticsOrder extends BaseEntity {
  @Column({ name: 'order_code', type: 'varchar', length: 40 })
  @Expose()
  orderCode: string;

  @Column({ name: 'shipping_demand_id', type: 'bigint', unsigned: true })
  @Expose()
  shippingDemandId: number;

  @ManyToOne(() => ShippingDemand, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'shipping_demand_id' })
  shippingDemand?: ShippingDemand;

  @Column({ name: 'shipping_demand_code', type: 'varchar', length: 40 })
  @Expose()
  shippingDemandCode: string;

  @Column({ name: 'sales_order_id', type: 'bigint', unsigned: true })
  @Expose()
  salesOrderId: number;

  @Column({ name: 'sales_order_code', type: 'varchar', length: 32 })
  @Expose()
  salesOrderCode: string;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  @Expose()
  status: LogisticsOrderStatus;

  @Column({ name: 'customer_id', type: 'bigint', unsigned: true })
  @Expose()
  customerId: number;

  @Column({ name: 'customer_name', type: 'varchar', length: 200 })
  @Expose()
  customerName: string;

  @Column({ name: 'customer_code', type: 'varchar', length: 50 })
  @Expose()
  customerCode: string;

  @Column({ name: 'domestic_trade_type', type: 'varchar', length: 20 })
  @Expose()
  domesticTradeType: DomesticTradeType;

  @Column({ name: 'logistics_provider_id', type: 'bigint', unsigned: true })
  @Expose()
  logisticsProviderId: number;

  @Column({ name: 'logistics_provider_name', type: 'varchar', length: 200 })
  @Expose()
  logisticsProviderName: string;

  @Column({ name: 'transportation_method', type: 'varchar', length: 30 })
  @Expose()
  transportationMethod: TransportationMethod;

  @Column({ name: 'company_id', type: 'bigint', unsigned: true })
  @Expose()
  companyId: number;

  @Column({ name: 'company_name', type: 'varchar', length: 200 })
  @Expose()
  companyName: string;

  @Column({
    name: 'origin_port_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  @Expose()
  originPortId: number | null;

  @Column({ name: 'origin_port_name', type: 'varchar', length: 200 })
  @Expose()
  originPortName: string;

  @Column({
    name: 'destination_port_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  @Expose()
  destinationPortId: number | null;

  @Column({ name: 'destination_port_name', type: 'varchar', length: 200 })
  @Expose()
  destinationPortName: string;

  @Column({
    name: 'destination_country_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  @Expose()
  destinationCountryId: number | null;

  @Column({ name: 'destination_country_name', type: 'varchar', length: 100 })
  @Expose()
  destinationCountryName: string;

  @Column({ name: 'required_delivery_at', type: 'date', nullable: true })
  @Expose()
  requiredDeliveryAt: string | null;

  @Column({
    name: 'requires_export_customs',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  @Expose()
  requiresExportCustoms: YesNo | null;

  @Column({ name: 'consignee_company', type: 'text', nullable: true })
  @Expose()
  consigneeCompany: string | null;

  @Column({ name: 'consignee_other_info', type: 'text', nullable: true })
  @Expose()
  consigneeOtherInfo: string | null;

  @Column({ name: 'notify_company', type: 'text', nullable: true })
  @Expose()
  notifyCompany: string | null;

  @Column({ name: 'notify_other_info', type: 'text', nullable: true })
  @Expose()
  notifyOtherInfo: string | null;

  @Column({ name: 'shipper_company', type: 'text', nullable: true })
  @Expose()
  shipperCompany: string | null;

  @Column({
    name: 'shipper_other_info_company_name',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  @Expose()
  shipperOtherInfoCompanyName: string | null;

  @Column({
    name: 'uses_default_shipping_mark',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  @Expose()
  usesDefaultShippingMark: YesNo | null;

  @Column({
    name: 'shipping_mark_note',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Expose()
  shippingMarkNote: string | null;

  @Column({
    name: 'needs_invoice',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  @Expose()
  needsInvoice: YesNo | null;

  @Column({ name: 'invoice_type', type: 'varchar', length: 30, nullable: true })
  @Expose()
  invoiceType: InvoiceType | null;

  @Column({
    name: 'shipping_documents_note',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  @Expose()
  shippingDocumentsNote: string | null;

  @Column({ name: 'bl_type', type: 'varchar', length: 30, nullable: true })
  @Expose()
  blType: BlType | null;

  @Column({ name: 'original_mail_address', type: 'text', nullable: true })
  @Expose()
  originalMailAddress: string | null;

  @Column({ name: 'customs_document_note', type: 'text', nullable: true })
  @Expose()
  customsDocumentNote: string | null;

  @Column({ name: 'other_requirement_note', type: 'text', nullable: true })
  @Expose()
  otherRequirementNote: string | null;

  @Column({ name: 'remarks', type: 'text', nullable: true })
  @Expose()
  remarks: string | null;

  @OneToMany(() => LogisticsOrderItem, (item) => item.logisticsOrder, {
    cascade: false,
  })
  @Expose()
  items?: LogisticsOrderItem[];

  @OneToMany(() => LogisticsOrderPackage, (pkg) => pkg.logisticsOrder, {
    cascade: false,
  })
  @Expose()
  packages?: LogisticsOrderPackage[];
}
