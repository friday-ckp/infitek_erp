import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';
import { Expose } from 'class-transformer';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  @Expose()
  id: number;

  @CreateDateColumn({ name: 'created_at' })
  @Expose()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @Expose()
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  @Expose()
  createdBy: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
  @Expose()
  updatedBy: string;
}
