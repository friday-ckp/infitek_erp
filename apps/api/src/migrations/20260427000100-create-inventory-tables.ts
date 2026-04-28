import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateInventoryTables20260427000100 implements MigrationInterface {
  name = 'CreateInventoryTables20260427000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inventory_summary',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'sku_id', type: 'bigint', unsigned: true },
          { name: 'warehouse_id', type: 'bigint', unsigned: true },
          { name: 'actual_quantity', type: 'int', default: 0 },
          { name: 'locked_quantity', type: 'int', default: 0 },
          { name: 'available_quantity', type: 'int', default: 0 },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('inventory_summary', [
      new TableIndex({
        name: 'uq_inventory_summary_sku_warehouse',
        columnNames: ['sku_id', 'warehouse_id'],
        isUnique: true,
      }),
      new TableIndex({
        name: 'idx_inventory_summary_sku_id',
        columnNames: ['sku_id'],
      }),
      new TableIndex({
        name: 'idx_inventory_summary_warehouse_id',
        columnNames: ['warehouse_id'],
      }),
    ]);
    await queryRunner.createForeignKeys('inventory_summary', [
      new TableForeignKey({
        columnNames: ['sku_id'],
        referencedTableName: 'skus',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'inventory_batch',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'batch_no', type: 'varchar', length: '60' },
          { name: 'sku_id', type: 'bigint', unsigned: true },
          { name: 'warehouse_id', type: 'bigint', unsigned: true },
          { name: 'batch_quantity', type: 'int', default: 0 },
          { name: 'batch_locked_quantity', type: 'int', default: 0 },
          { name: 'source_type', type: 'varchar', length: '40' },
          {
            name: 'source_document_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
          },
          { name: 'receipt_date', type: 'date' },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('inventory_batch', [
      new TableIndex({
        name: 'uq_inventory_batch_no',
        columnNames: ['batch_no'],
        isUnique: true,
      }),
      new TableIndex({
        name: 'idx_inventory_batch_sku_id',
        columnNames: ['sku_id'],
      }),
      new TableIndex({
        name: 'idx_inventory_batch_warehouse_id',
        columnNames: ['warehouse_id'],
      }),
      new TableIndex({
        name: 'idx_inventory_batch_source',
        columnNames: ['source_type', 'source_document_id'],
      }),
      new TableIndex({
        name: 'idx_inventory_batch_fifo',
        columnNames: ['sku_id', 'warehouse_id', 'receipt_date', 'id'],
      }),
    ]);
    await queryRunner.createForeignKeys('inventory_batch', [
      new TableForeignKey({
        columnNames: ['sku_id'],
        referencedTableName: 'skus',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inventory_batch');
    await queryRunner.dropTable('inventory_summary');
  }
}
