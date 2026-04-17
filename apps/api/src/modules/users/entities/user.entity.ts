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

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
