import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Expose } from 'class-transformer';
import {
  SupplierSettlementDateType,
  SupplierSettlementType,
} from '@infitek/shared';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { Supplier } from './supplier.entity';

@Entity('supplier_payment_terms')
@Index('idx_supplier_payment_terms_supplier_id', ['supplierId'])
export class SupplierPaymentTerm extends BaseEntity {
  @Column({ name: 'supplier_id', type: 'bigint', unsigned: true })
  @Expose()
  supplierId: number;

  @ManyToOne(() => Supplier, (supplier) => supplier.paymentTerms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'company_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  companyId: number | null;

  @Column({ name: 'company_name', type: 'varchar', length: 200, nullable: true })
  @Expose()
  companyName: string | null;

  @Column({ name: 'payment_term_name', type: 'varchar', length: 100, nullable: true })
  @Expose()
  paymentTermName: string | null;

  @Column({
    name: 'settlement_type',
    type: 'enum',
    enum: Object.values(SupplierSettlementType),
    nullable: true,
  })
  @Expose()
  settlementType: SupplierSettlementType | null;

  @Column({ name: 'settlement_days', type: 'int', unsigned: true, nullable: true })
  @Expose()
  settlementDays: number | null;

  @Column({ name: 'monthly_settlement_date', type: 'int', unsigned: true, nullable: true })
  @Expose()
  monthlySettlementDate: number | null;

  @Column({
    name: 'settlement_date_type',
    type: 'enum',
    enum: Object.values(SupplierSettlementDateType),
    nullable: true,
  })
  @Expose()
  settlementDateType: SupplierSettlementDateType | null;
}
