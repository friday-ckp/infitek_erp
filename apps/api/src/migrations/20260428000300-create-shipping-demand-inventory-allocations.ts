import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateShippingDemandInventoryAllocations20260428000300
  implements MigrationInterface
{
  name = 'CreateShippingDemandInventoryAllocations20260428000300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'shipping_demand_inventory_allocations',
        columns: [
          { name: 'id', type: 'bigint', unsigned: true, isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'shipping_demand_id', type: 'bigint', unsigned: true },
          { name: 'shipping_demand_item_id', type: 'bigint', unsigned: true },
          { name: 'sales_order_item_id', type: 'bigint', unsigned: true },
          { name: 'sku_id', type: 'bigint', unsigned: true },
          { name: 'warehouse_id', type: 'bigint', unsigned: true },
          { name: 'inventory_batch_id', type: 'bigint', unsigned: true },
          { name: 'lock_source', type: 'varchar', length: '40' },
          { name: 'source_document_type', type: 'varchar', length: '40' },
          { name: 'source_document_id', type: 'bigint', unsigned: true },
          { name: 'original_locked_quantity', type: 'int', default: 0 },
          { name: 'locked_quantity', type: 'int', default: 0 },
          { name: 'shipped_quantity', type: 'int', default: 0 },
          { name: 'released_quantity', type: 'int', default: 0 },
          { name: 'status', type: 'varchar', length: '20' },
          { name: 'source_action_key', type: 'varchar', length: '120' },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
          { name: 'created_by', type: 'varchar', length: '100', isNullable: true },
          { name: 'updated_by', type: 'varchar', length: '100', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('shipping_demand_inventory_allocations', [
      new TableIndex({ name: 'idx_sd_allocations_demand_id', columnNames: ['shipping_demand_id'] }),
      new TableIndex({ name: 'idx_sd_allocations_item_id', columnNames: ['shipping_demand_item_id'] }),
      new TableIndex({ name: 'idx_sd_allocations_sku_warehouse', columnNames: ['sku_id', 'warehouse_id'] }),
      new TableIndex({ name: 'idx_sd_allocations_batch_id', columnNames: ['inventory_batch_id'] }),
      new TableIndex({ name: 'idx_sd_allocations_status', columnNames: ['status'] }),
      new TableIndex({ name: 'uq_sd_allocations_action_batch', columnNames: ['source_action_key', 'inventory_batch_id'], isUnique: true }),
    ]);

    await queryRunner.createForeignKeys('shipping_demand_inventory_allocations', [
      new TableForeignKey({
        columnNames: ['shipping_demand_id'],
        referencedTableName: 'shipping_demands',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['shipping_demand_item_id'],
        referencedTableName: 'shipping_demand_items',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['sales_order_item_id'],
        referencedTableName: 'sales_order_items',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
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
        onDelete: 'RESTRICT',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('shipping_demand_inventory_allocations');
  }
}
