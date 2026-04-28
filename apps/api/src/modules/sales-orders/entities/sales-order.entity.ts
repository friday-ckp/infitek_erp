import { Column, Entity, Index, OneToMany, Unique } from 'typeorm';
import { Expose } from 'class-transformer';
import {
  CustomsDeclarationMethod,
  DomesticTradeType,
  InvoiceType,
  OrderNature,
  PaymentTerm,
  PrimaryIndustry,
  ReceiptStatus,
  SalesOrderStatus,
  SalesOrderSource,
  SalesOrderType,
  SecondaryIndustry,
  TradeTerm,
  TransportationMethod,
  YesNo,
  BlType,
} from '@infitek/shared';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ShippingDemand } from '../../shipping-demands/entities/shipping-demand.entity';
import { SalesOrderExpense } from './sales-order-expense.entity';
import { SalesOrderItem } from './sales-order-item.entity';

@Entity('sales_orders')
@Unique('uq_sales_orders_erp_code', ['erpSalesOrderCode'])
@Index('idx_sales_orders_customer_id', ['customerId'])
@Index('idx_sales_orders_status', ['status'])
@Index('idx_sales_orders_order_type', ['orderType'])
@Index('idx_sales_orders_created_at', ['createdAt'])
export class SalesOrder extends BaseEntity {
  @Column({ name: 'erp_sales_order_code', type: 'varchar', length: 32 })
  @Expose()
  erpSalesOrderCode: string;

  @Column({ name: 'domestic_trade_type', type: 'varchar', length: 20 })
  @Expose()
  domesticTradeType: DomesticTradeType;

  @Column({ name: 'external_order_code', type: 'varchar', length: 100 })
  @Expose()
  externalOrderCode: string;

  @Column({ name: 'order_source', type: 'varchar', length: 30, default: `'manual'` })
  @Expose()
  orderSource: SalesOrderSource;

  @Column({ name: 'order_type', type: 'varchar', length: 30 })
  @Expose()
  orderType: SalesOrderType;

  @Column({ name: 'customer_id', type: 'bigint' })
  @Expose()
  customerId: number;

  @Column({ name: 'customer_name', type: 'varchar', length: 200 })
  @Expose()
  customerName: string;

  @Column({ name: 'customer_code', type: 'varchar', length: 50 })
  @Expose()
  customerCode: string;

  @Column({ name: 'customer_contact_person', type: 'varchar', length: 100, nullable: true })
  @Expose()
  customerContactPerson: string | null;

  @Column({ name: 'after_sales_source_order_id', type: 'bigint', nullable: true })
  @Expose()
  afterSalesSourceOrderId: number | null;

  @Column({ name: 'after_sales_source_order_code', type: 'varchar', length: 32, nullable: true })
  @Expose()
  afterSalesSourceOrderCode: string | null;

  @Column({ name: 'after_sales_product_summary', type: 'text', nullable: true })
  @Expose()
  afterSalesProductSummary: string | null;

  @Column({ name: 'destination_country_id', type: 'bigint', nullable: true })
  @Expose()
  destinationCountryId: number | null;

  @Column({ name: 'destination_country_name', type: 'varchar', length: 100, nullable: true })
  @Expose()
  destinationCountryName: string | null;

  @Column({ name: 'payment_term', type: 'varchar', length: 80, nullable: true })
  @Expose()
  paymentTerm: PaymentTerm | null;

  @Column({ name: 'shipment_origin_country_id', type: 'bigint', nullable: true })
  @Expose()
  shipmentOriginCountryId: number | null;

  @Column({ name: 'shipment_origin_country_name', type: 'varchar', length: 100, nullable: true })
  @Expose()
  shipmentOriginCountryName: string | null;

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

  @Column({ name: 'other_industry_note', type: 'varchar', length: 255, nullable: true })
  @Expose()
  otherIndustryNote: string | null;

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

  @Column({ name: 'destination_port_id', type: 'bigint', nullable: true })
  @Expose()
  destinationPortId: number | null;

  @Column({ name: 'destination_port_name', type: 'varchar', length: 200, nullable: true })
  @Expose()
  destinationPortName: string | null;

  @Column({ name: 'bank_account', type: 'varchar', length: 255, nullable: true })
  @Expose()
  bankAccount: string | null;

  @Column({ name: 'extra_viewer_id', type: 'bigint', nullable: true })
  @Expose()
  extraViewerId: number | null;

  @Column({ name: 'extra_viewer_name', type: 'varchar', length: 100, nullable: true })
  @Expose()
  extraViewerName: string | null;

  @Column({ name: 'primary_industry', type: 'varchar', length: 50, nullable: true })
  @Expose()
  primaryIndustry: PrimaryIndustry | null;

  @Column({ name: 'exchange_rate', type: 'decimal', precision: 18, scale: 6, nullable: true })
  @Expose()
  exchangeRate: string | null;

  @Column({ name: 'transportation_method', type: 'varchar', length: 30, nullable: true })
  @Expose()
  transportationMethod: TransportationMethod | null;

  @Column({ name: 'crm_signed_at', type: 'date', nullable: true })
  @Expose()
  crmSignedAt: string | null;

  @Column({ name: 'contract_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  @Expose()
  contractAmount: string;

  @Column({ name: 'order_nature', type: 'varchar', length: 40, nullable: true })
  @Expose()
  orderNature: OrderNature | null;

  @Column({ name: 'secondary_industry', type: 'varchar', length: 50, nullable: true })
  @Expose()
  secondaryIndustry: SecondaryIndustry | null;

  @Column({ name: 'receipt_status', type: 'varchar', length: 30, nullable: true })
  @Expose()
  receiptStatus: ReceiptStatus | null;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  @Expose()
  status: SalesOrderStatus;

  @Column({ name: 'contract_file_keys', type: 'json', nullable: true })
  @Expose()
  contractFileKeys: string[] | null;

  @Column({ name: 'contract_file_names', type: 'json', nullable: true })
  @Expose()
  contractFileNames: string[] | null;

  @Column({ name: 'received_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  @Expose()
  receivedAmount: string;

  @Column({ name: 'merchandiser_id', type: 'bigint', nullable: true })
  @Expose()
  merchandiserId: number | null;

  @Column({ name: 'merchandiser_name', type: 'varchar', length: 100, nullable: true })
  @Expose()
  merchandiserName: string | null;

  @Column({ name: 'merchandiser_abbr', type: 'varchar', length: 20, nullable: true })
  @Expose()
  merchandiserAbbr: string | null;

  @Column({ name: 'outstanding_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  @Expose()
  outstandingAmount: string;

  @Column({ name: 'required_delivery_at', type: 'date', nullable: true })
  @Expose()
  requiredDeliveryAt: string | null;

  @Column({ name: 'is_shared_order', type: 'varchar', length: 10, nullable: true })
  @Expose()
  isSharedOrder: YesNo | null;

  @Column({ name: 'is_sinosure', type: 'varchar', length: 10, nullable: true })
  @Expose()
  isSinosure: YesNo | null;

  @Column({ name: 'is_palletized', type: 'varchar', length: 10, nullable: true })
  @Expose()
  isPalletized: YesNo | null;

  @Column({ name: 'requires_customs_certificate', type: 'varchar', length: 10, nullable: true })
  @Expose()
  requiresCustomsCertificate: YesNo | null;

  @Column({ name: 'is_split_in_advance', type: 'varchar', length: 10, nullable: true })
  @Expose()
  isSplitInAdvance: YesNo | null;

  @Column({ name: 'uses_marketing_fund', type: 'varchar', length: 10, nullable: true })
  @Expose()
  usesMarketingFund: YesNo | null;

  @Column({ name: 'requires_export_customs', type: 'varchar', length: 10, nullable: true })
  @Expose()
  requiresExportCustoms: YesNo | null;

  @Column({ name: 'requires_warranty_card', type: 'varchar', length: 10, nullable: true })
  @Expose()
  requiresWarrantyCard: YesNo | null;

  @Column({ name: 'requires_maternity_handover', type: 'varchar', length: 10, nullable: true })
  @Expose()
  requiresMaternityHandover: YesNo | null;

  @Column({ name: 'customs_declaration_method', type: 'varchar', length: 30, nullable: true })
  @Expose()
  customsDeclarationMethod: CustomsDeclarationMethod | null;

  @Column({ name: 'plug_photo_keys', type: 'json', nullable: true })
  @Expose()
  plugPhotoKeys: string[] | null;

  @Column({ name: 'is_insured', type: 'varchar', length: 10, nullable: true })
  @Expose()
  isInsured: YesNo | null;

  @Column({ name: 'is_ali_trade_assurance', type: 'varchar', length: 10, nullable: true })
  @Expose()
  isAliTradeAssurance: YesNo | null;

  @Column({ name: 'ali_trade_assurance_order_code', type: 'varchar', length: 100, nullable: true })
  @Expose()
  aliTradeAssuranceOrderCode: string | null;

  @Column({ name: 'forwarder_quote_note', type: 'text', nullable: true })
  @Expose()
  forwarderQuoteNote: string | null;

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

  @Column({ name: 'shipper_other_info_company_id', type: 'bigint', nullable: true })
  @Expose()
  shipperOtherInfoCompanyId: number | null;

  @Column({ name: 'shipper_other_info_company_name', type: 'varchar', length: 200, nullable: true })
  @Expose()
  shipperOtherInfoCompanyName: string | null;

  @Column({ name: 'domestic_customer_company', type: 'text', nullable: true })
  @Expose()
  domesticCustomerCompany: string | null;

  @Column({ name: 'domestic_customer_delivery_info', type: 'text', nullable: true })
  @Expose()
  domesticCustomerDeliveryInfo: string | null;

  @Column({ name: 'uses_default_shipping_mark', type: 'varchar', length: 10, nullable: true })
  @Expose()
  usesDefaultShippingMark: YesNo | null;

  @Column({ name: 'shipping_mark_note', type: 'varchar', length: 255, nullable: true })
  @Expose()
  shippingMarkNote: string | null;

  @Column({ name: 'shipping_mark_template_key', type: 'varchar', length: 255, nullable: true })
  @Expose()
  shippingMarkTemplateKey: string | null;

  @Column({ name: 'needs_invoice', type: 'varchar', length: 10, nullable: true })
  @Expose()
  needsInvoice: YesNo | null;

  @Column({ name: 'invoice_type', type: 'varchar', length: 30, nullable: true })
  @Expose()
  invoiceType: InvoiceType | null;

  @Column({ name: 'shipping_documents_note', type: 'varchar', length: 500, nullable: true })
  @Expose()
  shippingDocumentsNote: string | null;

  @Column({ name: 'bl_type', type: 'varchar', length: 30, nullable: true })
  @Expose()
  blType: BlType | null;

  @Column({ name: 'original_mail_address', type: 'text', nullable: true })
  @Expose()
  originalMailAddress: string | null;

  @Column({ name: 'business_rectification_note', type: 'text', nullable: true })
  @Expose()
  businessRectificationNote: string | null;

  @Column({ name: 'customs_document_note', type: 'text', nullable: true })
  @Expose()
  customsDocumentNote: string | null;

  @Column({ name: 'other_requirement_note', type: 'text', nullable: true })
  @Expose()
  otherRequirementNote: string | null;

  @Column({ name: 'product_total_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  @Expose()
  productTotalAmount: string;

  @Column({ name: 'expense_total_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  @Expose()
  expenseTotalAmount: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  @Expose()
  totalAmount: string;

  @OneToMany(() => SalesOrderItem, (item) => item.salesOrder, { cascade: false })
  @Expose()
  items?: SalesOrderItem[];

  @OneToMany(() => SalesOrderExpense, (expense) => expense.salesOrder, { cascade: false })
  @Expose()
  expenses?: SalesOrderExpense[];

  @OneToMany(() => ShippingDemand, (demand) => demand.salesOrder, { cascade: false })
  @Expose()
  shippingDemands?: ShippingDemand[];
}
