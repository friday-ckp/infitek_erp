import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOperationLogsTable20260425000100 implements MigrationInterface {
  name = 'CreateOperationLogsTable20260425000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'operation_logs',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'operator', type: 'varchar', length: '100', isNullable: false },
          { name: 'operator_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'action', type: 'enum', enum: ['CREATE', 'UPDATE', 'DELETE'], isNullable: false },
          { name: 'resource_type', type: 'varchar', length: '100', isNullable: false },
          { name: 'resource_id', type: 'varchar', length: '50', isNullable: true },
          { name: 'resource_path', type: 'varchar', length: '255', isNullable: false },
          { name: 'request_summary', type: 'json', isNullable: true },
          { name: 'change_summary', type: 'json', isNullable: true },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('operation_logs', [
      new TableIndex({
        name: 'idx_operation_logs_created_at',
        columnNames: ['created_at'],
      }),
      new TableIndex({
        name: 'idx_operation_logs_operator',
        columnNames: ['operator'],
      }),
      new TableIndex({
        name: 'idx_operation_logs_action',
        columnNames: ['action'],
      }),
      new TableIndex({
        name: 'idx_operation_logs_resource',
        columnNames: ['resource_type', 'resource_id'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('operation_logs');
  }
}
