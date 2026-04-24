import { Column, Entity, Index, Unique } from 'typeorm';
import { Expose } from 'class-transformer';
import { ContractTemplateStatus } from '@infitek/shared';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('contract_templates')
@Unique('uq_contract_templates_name', ['name'])
@Index('idx_contract_templates_status', ['status'])
@Index('idx_contract_templates_created_at', ['createdAt'])
export class ContractTemplate extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 200 })
  @Expose()
  name: string;

  @Column({ name: 'template_file_key', type: 'varchar', length: 500, nullable: true })
  @Expose()
  templateFileKey: string | null;

  @Column({ name: 'template_file_name', type: 'varchar', length: 200, nullable: true })
  @Expose()
  templateFileName: string | null;

  @Column({ name: 'description', type: 'text', nullable: true })
  @Expose()
  description: string | null;

  @Column({ name: 'content', type: 'longtext' })
  @Expose()
  content: string;

  @Column({ name: 'is_default', type: 'tinyint', width: 1, default: 0 })
  @Expose()
  isDefault: number;

  @Column({ name: 'requires_legal_review', type: 'tinyint', width: 1, default: 0 })
  @Expose()
  requiresLegalReview: number;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: ContractTemplateStatus.PENDING_SUBMIT,
  })
  @Expose()
  status: ContractTemplateStatus;
}
