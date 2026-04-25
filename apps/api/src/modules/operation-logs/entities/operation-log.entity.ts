import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Expose } from 'class-transformer';

export const OperationLogAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;

export type OperationLogAction =
  (typeof OperationLogAction)[keyof typeof OperationLogAction];

export interface OperationLogChangeSummaryItem {
  field: string;
  fieldLabel?: string;
  oldValue: unknown;
  newValue: unknown;
}

@Entity('operation_logs')
@Index('idx_operation_logs_created_at', ['createdAt'])
@Index('idx_operation_logs_operator', ['operator'])
@Index('idx_operation_logs_action', ['action'])
@Index('idx_operation_logs_resource', ['resourceType', 'resourceId'])
export class OperationLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  @Expose()
  id: number;

  @Column({ name: 'operator', type: 'varchar', length: 100 })
  @Expose()
  operator: string;

  @Column({ name: 'operator_id', type: 'bigint', unsigned: true, nullable: true })
  @Expose()
  operatorId: number | null;

  @Column({
    name: 'action',
    type: 'enum',
    enum: Object.values(OperationLogAction),
  })
  @Expose()
  action: OperationLogAction;

  @Column({ name: 'resource_type', type: 'varchar', length: 100 })
  @Expose()
  resourceType: string;

  @Column({ name: 'resource_id', type: 'varchar', length: 50, nullable: true })
  @Expose()
  resourceId: string | null;

  @Column({ name: 'resource_path', type: 'varchar', length: 255 })
  @Expose()
  resourcePath: string;

  @Column({ name: 'request_summary', type: 'json', nullable: true })
  @Expose()
  requestSummary: Record<string, unknown> | null;

  @Column({ name: 'change_summary', type: 'json', nullable: true })
  @Expose()
  changeSummary: OperationLogChangeSummaryItem[] | null;

  @CreateDateColumn({ name: 'created_at' })
  @Expose()
  createdAt: Date;
}
