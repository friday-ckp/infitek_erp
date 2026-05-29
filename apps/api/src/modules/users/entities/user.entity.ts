import { Entity, Column, Index, DeleteDateColumn } from 'typeorm';
import { Expose, Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserStatus } from '@infitek/shared';

@Entity('users')
export class User extends BaseEntity {
  @Index('idx_users_username', { unique: true })
  @Column({ name: 'username', type: 'varchar', length: 50 })
  @Expose()
  username: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  @Expose()
  name: string;

  @Column({ name: 'password', type: 'varchar', length: 255 })
  @Exclude()
  password: string;

  @Column({ name: 'status', type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  @Expose()
  status: UserStatus;

  @Index('idx_users_dingtalk_union_id', { unique: true })
  @Column({ name: 'dingtalk_union_id', type: 'varchar', length: 128, nullable: true })
  @Exclude()
  dingtalkUnionId: string | null;

  @Column({ name: 'dingtalk_user_id', type: 'varchar', length: 128, nullable: true })
  @Exclude()
  dingtalkUserId: string | null;

  @Column({ name: 'dingtalk_open_id', type: 'varchar', length: 128, nullable: true })
  @Exclude()
  dingtalkOpenId: string | null;

  @Column({ name: 'dingtalk_nick', type: 'varchar', length: 100, nullable: true })
  @Expose()
  dingtalkNick: string | null;

  @Column({ name: 'dingtalk_avatar', type: 'varchar', length: 500, nullable: true })
  @Exclude()
  dingtalkAvatar: string | null;

  @Column({ name: 'dingtalk_bound_at', type: 'timestamp', nullable: true })
  @Expose()
  dingtalkBoundAt: Date | null;

  @Expose()
  get dingtalkBindingStatus(): 'BOUND' | 'UNBOUND' {
    return this.dingtalkUnionId ? 'BOUND' : 'UNBOUND';
  }

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
