import { Entity, Column, Index, DeleteDateColumn } from 'typeorm';
import { Expose, Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('users')
export class User extends BaseEntity {
  @Index('idx_users_username', { unique: true })
  @Column({ name: 'username', length: 50 })
  @Expose()
  username: string;

  @Column({ name: 'name', length: 100 })
  @Expose()
  name: string;

  @Column({ name: 'password', length: 255 })
  @Exclude()
  password: string;

  @Column({ name: 'status', type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  @Expose()
  status: UserStatus;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
