import { Expose } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import {
  DomesticTradeType,
  OrderNature,
  PaymentTerm,
  ReceiptStatus,
  SalesOrderType,
  ShippingDemandStatus,
  TradeTerm,
  TransportationMethod,
  YesNo,
} from '@infitek/shared';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SalesOrder } from '../../sales-orders/entities/sales-order.entity';
import { ShippingDemandItem } from './shipping-demand-item.entity';

@Entity('shipping_demands')
@Unique('uq_shipping_demands_demand_code', ['demandCode'])
@Index('idx_shipping_demands_sales_order_id', ['salesOrderId'])
@Index('idx_shipping_demands_status', ['status'])
@Index('idx_shipping_demands_created_at', ['createdAt'])
export class ShippingDemand extends BaseEntity {
  @Column({ name: 'demand_code', type: 'varchar', length: 40 })
  @Expose()
  demandCode: string;

  @Column({ name: 'sales_order_id', type: 'bigint' })
  @Expose()
  salesOrderId: number;

  @ManyToOne(() => SalesOrder, (salesOrder) => salesOrder.shippingDemands, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'sales_order_id' })
  salesOrder?: SalesOrder;

  @Column({ name: 'source_document_code', type: 'varchar', length: 32 })
  @Expose()
  sourceDocumentCode: string;

  @Column({ name: 'source_document_type', type: 'varchar', length: 40, default: "'sales_order'" })
  @Expose()
  sourceDocumentType: string;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  @Expose()
  status: ShippingDemandStatus;

  @Column({ name: 'order_type', type: 'varchar', length: 30 })
  @Expose()
  orderType: SalesOrderType;

  @Column({ name: 'domestic_trade_type', type: 'varchar', length: 20 })
  @Expose()
  domesticTradeType: DomesticTradeType;

  @Column({ name: 'customer_id', type: 'bigint' })
  @Expose()
  customerId: number;

  @Column({ name: 'customer_name', type: 'varchar', length: 200 })
  @Expose()
  customerName: string;

  @Column({ name: 'customer_code', type: 'varchar', length: 50 })
  @Expose()
  customerCode: string;

  @Column({ name: 'currency_id', type: 'bigint', nullable: true })
  @Expose()
  currencyId: number | null;

  @Column({ name: 'currency_code', type: 'varchar', length: 20, nullable: true })
  @Expose()
  currencyCode: string | null;

  @Column({ name: 'currency_name', type: 'varchar', length: 50, nullable: true })
  @Expose()
  currencyName: string | null;

  @Column({ name: 'currency_symbol', type: 'varchar', length: 20, nullable: true })
  @Expose()
  currencySymbol: string | null;

  @Column({ name: 'trade_term', type: 'varchar', length: 10, nullable: true })
  @Expose()
  tradeTerm: TradeTerm | null;

  @Column({ name: 'payment_term', type: 'varchar', length: 80, nullable: true })
  @Expose()
  paymentTerm: PaymentTerm | null;

  @Column({ name: 'shipment_origin_country_id', type: 'bigint', nullable: true })
  @Expose()
  shipmentOriginCountryId: number | null;

  @Column({ name: 'shipment_origin_country_name', type: 'varchar', length: 100, nullable: true })
  @Expose()
  shipmentOriginCountryName: string | null;

  @Column({ name: 'destination_country_id', type: 'bigint', nullable: true })
  @Expose()
  destinationCountryId: number | null;

  @Column({ name: 'destination_country_name', type: 'varchar', length: 100, nullable: true })
  @Expose()
  destinationCountryName: string | null;

  @Column({ name: 'destination_port_id', type: 'bigint', nullable: true })
  @Expose()
  destinationPortId: number | null;

  @Column({ name: 'destination_port_name', type: 'varchar', length: 200, nullable: true })
  @Expose()
  destinationPortName: string | null;

  @Column({ name: 'signing_company_id', type: 'bigint', nullable: true })
  @Expose()
  signingCompanyId: number | null;

  @Column({ name: 'signing_company_name', type: 'varchar', length: 200, nullable: true })
  @Expose()
  signingCompanyName: string | null;

  @Column({ name: 'salesperson_id', type: 'bigint', nullable: true })
  @Expose()
  salespersonId: number | null;

  @Column({ name: 'salesperson_name', type: 'varchar', length: 100, nullable: true })
  @Expose()
  salespersonName: string | null;

  @Column({ name: 'merchandiser_id', type: 'bigint', nullable: true })
  @Expose()
  merchandiserId: number | null;

  @Column({ name: 'merchandiser_name', type: 'varchar', length: 100, nullable: true })
  @Expose()
  merchandiserName: string | null;

  @Column({ name: 'merchandiser_abbr', type: 'varchar', length: 20, nullable: true })
  @Expose()
  merchandiserAbbr: string | null;

  @Column({ name: 'order_nature', type: 'varchar', length: 40, nullable: true })
  @Expose()
  orderNature: OrderNature | null;

  @Column({ name: 'receipt_status', type: 'varchar', length: 30, nullable: true })
  @Expose()
  receiptStatus: ReceiptStatus | null;

  @Column({ name: 'transportation_method', type: 'varchar', length: 30, nullable: true })
  @Expose()
  transportationMethod: TransportationMethod | null;

  @Column({ name: 'required_delivery_at', type: 'date', nullable: true })
  @Expose()
  requiredDeliveryAt: string | null;

  @Column({ name: 'is_shared_order', type: 'varchar', length: 10, nullable: true })
  @Expose()
  isSharedOrder: YesNo | null;

  @Column({ name: 'is_sinosure', type: 'varchar', length: 10, nullable: true })
  @Expose()
  isSinosure: YesNo | null;

  @Column({ name: 'is_ali_trade_assurance', type: 'varchar', length: 10, nullable: true })
  @Expose()
  isAliTradeAssurance: YesNo | null;

  @Column({ name: 'is_insured', type: 'varchar', length: 10, nullable: true })
  @Expose()
  isInsured: YesNo | null;

  @Column({ name: 'is_palletized', type: 'varchar', length: 10, nullable: true })
  @Expose()
  isPalletized: YesNo | null;

  @Column({ name: 'requires_export_customs', type: 'varchar', length: 10, nullable: true })
  @Expose()
  requiresExportCustoms: YesNo | null;

  @Column({ name: 'requires_warranty_card', type: 'varchar', length: 10, nullable: true })
  @Expose()
  requiresWarrantyCard: YesNo | null;

  @Column({ name: 'requires_customs_certificate', type: 'varchar', length: 10, nullable: true })
  @Expose()
  requiresCustomsCertificate: YesNo | null;

  @Column({ name: 'uses_marketing_fund', type: 'varchar', length: 10, nullable: true })
  @Expose()
  usesMarketingFund: YesNo | null;

  @Column({ name: 'contract_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  @Expose()
  contractAmount: string;

  @Column({ name: 'received_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  @Expose()
  receivedAmount: string;

  @Column({ name: 'outstanding_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  @Expose()
  outstandingAmount: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  @Expose()
  totalAmount: string;

  @OneToMany(() => ShippingDemandItem, (item) => item.shippingDemand, { cascade: false })
  @Expose()
  items?: ShippingDemandItem[];

  @Expose()
  skuCount?: number;
}
