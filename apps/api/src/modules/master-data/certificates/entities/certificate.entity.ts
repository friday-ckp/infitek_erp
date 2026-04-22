import { Column, Entity, Index, JoinTable, ManyToMany, Unique } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { Spu } from '../../spus/entities/spu.entity';

@Entity('certificates')
@Unique('uq_certificates_certificate_no', ['certificateNo'])
@Index('idx_certificates_category_id', ['categoryId'])
export class Certificate extends BaseEntity {
  @Column({ name: 'certificate_no', type: 'varchar', length: 30 })
  @Expose()
  certificateNo: string;

  @Column({ name: 'certificate_name', type: 'varchar', length: 200 })
  @Expose()
  certificateName: string;

  @Column({ name: 'certificate_type', type: 'varchar', length: 50 })
  @Expose()
  certificateType: string;

  @Column({ name: 'directive', type: 'varchar', length: 200, nullable: true })
  @Expose()
  directive: string | null;

  @Column({ name: 'issue_date', type: 'date', nullable: true })
  @Expose()
  issueDate: string | null;

  @Column({ name: 'valid_from', type: 'date' })
  @Expose()
  validFrom: string;

  @Column({ name: 'valid_until', type: 'date' })
  @Expose()
  validUntil: string;

  @Column({ name: 'issuing_authority', type: 'varchar', length: 200 })
  @Expose()
  issuingAuthority: string;

  @Column({ name: 'remarks', type: 'text', nullable: true })
  @Expose()
  remarks: string | null;

  @Column({ name: 'attribution_type', type: 'varchar', length: 50, nullable: true })
  @Expose()
  attributionType: string | null;

  @Column({ name: 'category_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  categoryId: number | null;

  @Column({ name: 'file_key', type: 'varchar', length: 500, nullable: true })
  @Expose()
  fileKey: string | null;

  @Column({ name: 'file_name', type: 'varchar', length: 200, nullable: true })
  @Expose()
  fileName: string | null;

  @ManyToMany(() => Spu, { eager: false })
  @JoinTable({
    name: 'certificate_spus',
    joinColumn: { name: 'certificate_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'spu_id', referencedColumnName: 'id' },
  })
  @Expose()
  spus: Spu[];
}
