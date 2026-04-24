import { Column, Entity, Index, OneToMany, Unique } from 'typeorm';
import { Expose } from 'class-transformer';
import { SupplierInvoiceType, SupplierStatus } from '@infitek/shared';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { SupplierPaymentTerm } from './supplier-payment-term.entity';

@Entity('suppliers')
@Unique('uq_suppliers_supplier_code', ['supplierCode'])
@Index('idx_suppliers_name', ['name'])
export class Supplier extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 200 })
  @Expose()
  name: string;

  @Column({ name: 'short_name', type: 'varchar', length: 100, nullable: true })
  @Expose()
  shortName: string | null;

  @Column({ name: 'supplier_code', type: 'varchar', length: 20 })
  @Expose()
  supplierCode: string;

  @Column({ name: 'contact_person', type: 'varchar', length: 100, nullable: true })
  @Expose()
  contactPerson: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 50, nullable: true })
  @Expose()
  contactPhone: string | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 100, nullable: true })
  @Expose()
  contactEmail: string | null;

  @Column({ name: 'address', type: 'varchar', length: 500, nullable: true })
  @Expose()
  address: string | null;

  @Column({ name: 'country_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  countryId: number | null;

  @Column({ name: 'country_name', type: 'varchar', length: 100, nullable: true })
  @Expose()
  countryName: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: Object.values(SupplierStatus),
    default: SupplierStatus.COOPERATING,
  })
  @Expose()
  status: SupplierStatus;

  @Column({ name: 'supplier_level', type: 'varchar', length: 50, nullable: true })
  @Expose()
  supplierLevel: string | null;

  @Column({
    name: 'invoice_type',
    type: 'enum',
    enum: Object.values(SupplierInvoiceType),
    nullable: true,
  })
  @Expose()
  invoiceType: SupplierInvoiceType | null;

  @Column({ name: 'origin', type: 'varchar', length: 100, nullable: true })
  @Expose()
  origin: string | null;

  @Column({ name: 'annual_rebate_enabled', type: 'tinyint', width: 1, default: 0 })
  @Expose()
  annualRebateEnabled: number;

  @Column({ name: 'contract_framework_file', type: 'varchar', length: 500, nullable: true })
  @Expose()
  contractFrameworkFile: string | null;

  @Column({ name: 'contract_template_name', type: 'varchar', length: 200, nullable: true })
  @Expose()
  contractTemplateName: string | null;

  @Column({ name: 'annual_rebate_note', type: 'text', nullable: true })
  @Expose()
  annualRebateNote: string | null;

  @Column({ name: 'contract_terms', type: 'text', nullable: true })
  @Expose()
  contractTerms: string | null;

  @OneToMany(() => SupplierPaymentTerm, (paymentTerm) => paymentTerm.supplier, {
    cascade: false,
    eager: false,
  })
  @Expose()
  paymentTerms: SupplierPaymentTerm[];
}
