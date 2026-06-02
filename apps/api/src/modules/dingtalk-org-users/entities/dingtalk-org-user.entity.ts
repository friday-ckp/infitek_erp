import { Column, DeleteDateColumn, Entity, Index } from 'typeorm';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DingtalkOrgUserStatus } from '@infitek/shared';

@Entity('dingtalk_org_users')
export class DingtalkOrgUser extends BaseEntity {
  @Index('idx_dingtalk_org_users_union_id', { unique: true })
  @Column({ name: 'union_id', type: 'varchar', length: 128 })
  @Expose()
  unionId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 128, nullable: true })
  @Expose()
  userId: string | null;

  @Column({ name: 'open_id', type: 'varchar', length: 128, nullable: true })
  @Expose()
  openId: string | null;

  @Column({ name: 'nick', type: 'varchar', length: 100, nullable: true })
  @Expose()
  nick: string | null;

  @Column({ name: 'mobile', type: 'varchar', length: 32, nullable: true })
  @Expose()
  mobile: string | null;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  @Expose()
  email: string | null;

  @Column({ name: 'job_number', type: 'varchar', length: 64, nullable: true })
  @Expose()
  jobNumber: string | null;

  @Column({ name: 'department_names', type: 'json', nullable: true })
  @Expose()
  departmentNames: string[] | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: DingtalkOrgUserStatus,
    default: DingtalkOrgUserStatus.UNBOUND,
  })
  @Expose()
  status: string;

  @Column({ name: 'suggested_user_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  suggestedUserId: number | null;

  @Column({ name: 'match_reason', type: 'varchar', length: 255, nullable: true })
  @Expose()
  matchReason: string | null;

  @Column({ name: 'last_synced_at', type: 'timestamp', nullable: true })
  @Expose()
  lastSyncedAt: Date | null;

  @Column({ name: 'last_processed_at', type: 'timestamp', nullable: true })
  @Expose()
  lastProcessedAt: Date | null;

  @Column({ name: 'processed_by', type: 'varchar', length: 100, nullable: true })
  @Expose()
  processedBy: string | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
