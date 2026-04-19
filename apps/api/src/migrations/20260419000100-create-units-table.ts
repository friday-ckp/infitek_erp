import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUnitsTable20260419000100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'units',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'code', type: 'varchar', length: '50', isNullable: false },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive'],
            default: "'active'",
          },
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

    await queryRunner.createIndices('units', [
      new TableIndex({
        name: 'idx_units_code',
        columnNames: ['code'],
        isUnique: true,
      }),
      new TableIndex({
        name: 'idx_units_name',
        columnNames: ['name'],
      }),
      new TableIndex({
        name: 'idx_units_deleted_at',
        columnNames: ['deleted_at'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('units');
  }
}
