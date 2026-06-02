import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDingtalkOrgUsersTable20260601000100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      { name: 'mobile', type: 'varchar', length: '32', isNullable: true } as any,
      { name: 'email', type: 'varchar', length: '255', isNullable: true } as any,
      { name: 'job_number', type: 'varchar', length: '64', isNullable: true } as any,
    ]);

    await queryRunner.createIndices('users', [
      new TableIndex({ name: 'idx_users_mobile', columnNames: ['mobile'] }),
      new TableIndex({ name: 'idx_users_email', columnNames: ['email'] }),
      new TableIndex({ name: 'idx_users_job_number', columnNames: ['job_number'] }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'dingtalk_org_users',
        columns: [
          { name: 'id', type: 'bigint', unsigned: true, isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'union_id', type: 'varchar', length: '128' },
          { name: 'user_id', type: 'varchar', length: '128', isNullable: true },
          { name: 'open_id', type: 'varchar', length: '128', isNullable: true },
          { name: 'nick', type: 'varchar', length: '100', isNullable: true },
          { name: 'mobile', type: 'varchar', length: '32', isNullable: true },
          { name: 'email', type: 'varchar', length: '255', isNullable: true },
          { name: 'job_number', type: 'varchar', length: '64', isNullable: true },
          { name: 'department_names', type: 'json', isNullable: true },
          { name: 'status', type: 'enum', enum: ['UNBOUND', 'CANDIDATE', 'CONFLICT', 'BOUND'], default: "'UNBOUND'" },
          { name: 'suggested_user_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'match_reason', type: 'varchar', length: '255', isNullable: true },
          { name: 'last_synced_at', type: 'timestamp', isNullable: true },
          { name: 'last_processed_at', type: 'timestamp', isNullable: true },
          { name: 'processed_by', type: 'varchar', length: '100', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
          { name: 'created_by', type: 'varchar', length: '100', isNullable: true },
          { name: 'updated_by', type: 'varchar', length: '100', isNullable: true },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
    );

    await queryRunner.createIndices('dingtalk_org_users', [
      new TableIndex({
        name: 'idx_dingtalk_org_users_union_id',
        columnNames: ['union_id'],
        isUnique: true,
      }),
      new TableIndex({
        name: 'idx_dingtalk_org_users_status',
        columnNames: ['status'],
      }),
      new TableIndex({
        name: 'idx_dingtalk_org_users_suggested_user_id',
        columnNames: ['suggested_user_id'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('dingtalk_org_users', 'idx_dingtalk_org_users_suggested_user_id');
    await queryRunner.dropIndex('dingtalk_org_users', 'idx_dingtalk_org_users_status');
    await queryRunner.dropIndex('dingtalk_org_users', 'idx_dingtalk_org_users_union_id');
    await queryRunner.dropTable('dingtalk_org_users');
    await queryRunner.dropIndex('users', 'idx_users_job_number');
    await queryRunner.dropIndex('users', 'idx_users_email');
    await queryRunner.dropIndex('users', 'idx_users_mobile');
    await queryRunner.dropColumns('users', ['job_number', 'email', 'mobile']);
  }
}
