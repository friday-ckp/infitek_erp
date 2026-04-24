import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePortsTable20260424000200 implements MigrationInterface {
  name = 'CreatePortsTable20260424000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'ports',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'port_type',
            type: 'enum',
            enum: ['起运港', '目的港'],
            isNullable: false,
          },
          { name: 'port_code', type: 'varchar', length: '50', isNullable: false },
          { name: 'name_cn', type: 'varchar', length: '200', isNullable: false },
          { name: 'name_en', type: 'varchar', length: '200', isNullable: false },
          { name: 'country_id', type: 'bigint', isNullable: false },
          { name: 'country_name', type: 'varchar', length: '100', isNullable: false },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          { name: 'created_by', type: 'varchar', length: '100', isNullable: true },
          { name: 'updated_by', type: 'varchar', length: '100', isNullable: true },
          { name: 'deleted_at', type: 'datetime', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('ports', [
      new TableIndex({
        name: 'idx_ports_code',
        columnNames: ['port_code'],
        isUnique: true,
      }),
      new TableIndex({
        name: 'idx_ports_country_id',
        columnNames: ['country_id'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ports');
  }
}
