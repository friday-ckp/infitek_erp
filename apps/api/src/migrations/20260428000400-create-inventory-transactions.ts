import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateInventoryTransactions20260428000400
  implements MigrationInterface
{
  name = 'CreateInventoryTransactions20260428000400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inventory_transactions',
        columns: [
          { name: 'id', type: 'bigint', unsigned: true, isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'sku_id', type: 'bigint', unsigned: true },
          { name: 'warehouse_id', type: 'bigint', unsigned: true },
          { name: 'inventory_batch_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'change_type', type: 'varchar', length: '30' },
          { name: 'actual_quantity_delta', type: 'int', default: 0 },
          { name: 'locked_quantity_delta', type: 'int', default: 0 },
          { name: 'available_quantity_delta', type: 'int', default: 0 },
          { name: 'before_actual_quantity', type: 'int', default: 0 },
          { name: 'after_actual_quantity', type: 'int', default: 0 },
          { name: 'before_locked_quantity', type: 'int', default: 0 },
          { name: 'after_locked_quantity', type: 'int', default: 0 },
          { name: 'before_available_quantity', type: 'int', default: 0 },
          { name: 'after_available_quantity', type: 'int', default: 0 },
          { name: 'source_document_type', type: 'varchar', length: '40' },
          { name: 'source_document_id', type: 'bigint', unsigned: true },
          { name: 'source_document_item_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'source_action_key', type: 'varchar', length: '160' },
          { name: 'operated_by', type: 'varchar', length: '100', isNullable: true },
          { name: 'operated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('inventory_transactions', [
      new TableIndex({ name: 'idx_inventory_transactions_sku_warehouse', columnNames: ['sku_id', 'warehouse_id'] }),
      new TableIndex({ name: 'idx_inventory_transactions_change_type', columnNames: ['change_type'] }),
      new TableIndex({ name: 'idx_inventory_transactions_source', columnNames: ['source_document_type', 'source_document_id'] }),
      new TableIndex({ name: 'uq_inventory_transactions_action_key', columnNames: ['source_action_key'], isUnique: true }),
      new TableIndex({ name: 'idx_inventory_transactions_created_at', columnNames: ['operated_at'] }),
    ]);

    await queryRunner.createForeignKeys('inventory_transactions', [
      new TableForeignKey({
        columnNames: ['sku_id'],
        referencedTableName: 'skus',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        columnNames: ['inventory_batch_id'],
        referencedTableName: 'inventory_batch',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inventory_transactions');
  }
}
