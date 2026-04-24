import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateLogisticsProvidersTable20260424000300
  implements MigrationInterface
{
  name = 'CreateLogisticsProvidersTable20260424000300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'logistics_providers',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', length: '200', isNullable: false },
          { name: 'provider_code', type: 'varchar', length: '20', isNullable: false },
          { name: 'short_name', type: 'varchar', length: '100', isNullable: false },
          { name: 'contact_person', type: 'varchar', length: '100', isNullable: false },
          { name: 'contact_phone', type: 'varchar', length: '50', isNullable: false },
          { name: 'contact_email', type: 'varchar', length: '200', isNullable: false },
          { name: 'address', type: 'varchar', length: '500', isNullable: false },
          {
            name: 'status',
            type: 'enum',
            enum: ['合作', '淘汰'],
            default: "'合作'",
          },
          { name: 'provider_level', type: 'int', isNullable: true },
          { name: 'country_id', type: 'bigint', isNullable: true },
          { name: 'country_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'default_company_id', type: 'bigint', isNullable: false },
          {
            name: 'default_company_name',
            type: 'varchar',
            length: '200',
            isNullable: false,
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

    await queryRunner.createIndices('logistics_providers', [
      new TableIndex({
        name: 'idx_logistics_providers_name',
        columnNames: ['name'],
        isUnique: true,
      }),
      new TableIndex({
        name: 'idx_logistics_providers_code',
        columnNames: ['provider_code'],
        isUnique: true,
      }),
      new TableIndex({
        name: 'idx_logistics_providers_country_id',
        columnNames: ['country_id'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('logistics_providers');
  }
}
