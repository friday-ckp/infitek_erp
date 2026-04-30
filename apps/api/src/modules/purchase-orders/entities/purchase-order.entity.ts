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
  PurchaseOrderApplicationType,
  PurchaseOrderDemandType,
  PurchaseOrderReceiptStatus,
  PurchaseOrderSettlementDateType,
  PurchaseOrderSettlementType,
  PurchaseOrderStatus,
  PurchaseOrderType,
  YesNo,
} from '@infitek/shared';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ContractTemplate } from '../../master-data/contract-templates/entities/contract-template.entity';
import { ReceiptOrder } from '../../receipt-orders/entities/receipt-order.entity';
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
    name: 'supplier_code',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  @Expose()
  supplierCode: string | null;

  @Column({
    name: 'supplier_name_text',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  @Expose()
  supplierNameText: string | null;

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
    name: 'supplier_address',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  @Expose()
  supplierAddress: string | null;

  @Column({ name: 'po_delivery_date', type: 'date', nullable: true })
  @Expose()
  poDeliveryDate: string | null;

  @Column({ name: 'arrival_date', type: 'date', nullable: true })
  @Expose()
  arrivalDate: string | null;

  @Column({ name: 'is_prepaid', type: 'varchar', length: 10, nullable: true })
  @Expose()
  isPrepaid: YesNo | null;

  @Column({ name: 'prepaid_ratio', type: 'int', nullable: true })
  @Expose()
  prepaidRatio: number | null;

  @Column({ name: 'plug_photo_keys', type: 'json', nullable: true })
  @Expose()
  plugPhotoKeys: string[] | null;

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

  @Column({ name: 'company_address_cn', type: 'text', nullable: true })
  @Expose()
  companyAddressCn: string | null;

  @Column({
    name: 'company_signing_location',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  @Expose()
  companySigningLocation: string | null;

  @Column({
    name: 'company_contact_person',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  @Expose()
  companyContactPerson: string | null;

  @Column({
    name: 'company_contact_phone',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  @Expose()
  companyContactPhone: string | null;

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

  @Column({
    name: 'contract_template_id_text',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  @Expose()
  contractTemplateIdText: string | null;

  @Column({ name: 'order_type', type: 'varchar', length: 30 })
  @Expose()
  orderType: PurchaseOrderType;

  @Column({
    name: 'application_type',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  @Expose()
  applicationType: PurchaseOrderApplicationType | null;

  @Column({
    name: 'demand_type',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  @Expose()
  demandType: PurchaseOrderDemandType | null;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  @Expose()
  status: PurchaseOrderStatus;

  @Column({ name: 'currency_id', type: 'bigint', nullable: true })
  @Expose()
  currencyId: number | null;

  @Column({
    name: 'currency_code',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  @Expose()
  currencyCode: string | null;

  @Column({
    name: 'currency_name',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  @Expose()
  currencyName: string | null;

  @Column({
    name: 'currency_symbol',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  @Expose()
  currencySymbol: string | null;

  @Column({
    name: 'settlement_date_type',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  @Expose()
  settlementDateType: PurchaseOrderSettlementDateType | null;

  @Column({
    name: 'settlement_type',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  @Expose()
  settlementType: PurchaseOrderSettlementType | null;

  @Column({ name: 'purchaser_id', type: 'bigint', nullable: true })
  @Expose()
  purchaserId: number | null;

  @Column({
    name: 'purchaser_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  @Expose()
  purchaserName: string | null;

  @Column({
    name: 'salesperson_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  @Expose()
  salespersonName: string | null;

  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  @Expose()
  purchaseDate: string | null;

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

  @Column({
    name: 'paid_amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  @Expose()
  paidAmount: string;

  @Column({ name: 'received_total_quantity', type: 'int', default: 0 })
  @Expose()
  receivedTotalQuantity: number;

  @Column({
    name: 'receipt_status',
    type: 'varchar',
    length: 30,
    default: PurchaseOrderReceiptStatus.NOT_RECEIVED,
  })
  @Expose()
  receiptStatus: PurchaseOrderReceiptStatus;

  @Column({
    name: 'is_fully_paid',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  @Expose()
  isFullyPaid: YesNo | null;

  @Column({
    name: 'supplier_stamped_contract_keys',
    type: 'json',
    nullable: true,
  })
  @Expose()
  supplierStampedContractKeys: string[] | null;

  @Column({ name: 'both_stamped_contract_keys', type: 'json', nullable: true })
  @Expose()
  bothStampedContractKeys: string[] | null;

  @Column({
    name: 'supplier_contract_uploaded',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  @Expose()
  supplierContractUploaded: YesNo | null;

  @Column({
    name: 'both_contract_uploaded',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  @Expose()
  bothContractUploaded: YesNo | null;

  @Column({ name: 'remark', type: 'text', nullable: true })
  @Expose()
  remark: string | null;

  @Column({
    name: 'business_rectification_requirement',
    type: 'text',
    nullable: true,
  })
  @Expose()
  businessRectificationRequirement: string | null;

  @Column({
    name: 'commercial_rectification_requirement',
    type: 'text',
    nullable: true,
  })
  @Expose()
  commercialRectificationRequirement: string | null;

  @Column({
    name: 'form_error_message',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  @Expose()
  formErrorMessage: string | null;

  @Column({ name: 'invoice_completed_at', type: 'date', nullable: true })
  @Expose()
  invoiceCompletedAt: string | null;

  @Column({ name: 'payment_completed_at', type: 'date', nullable: true })
  @Expose()
  paymentCompletedAt: string | null;

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

  @OneToMany(() => ReceiptOrder, (receiptOrder) => receiptOrder.purchaseOrder, {
    cascade: false,
  })
  @Expose()
  receiptOrders?: ReceiptOrder[];
}
