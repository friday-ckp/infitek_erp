import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateOutboundOrders20260503000100 implements MigrationInterface {
  name = 'CreateOutboundOrders20260503000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'outbound_orders',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'outbound_code', type: 'varchar', length: '40' },
          { name: 'logistics_order_id', type: 'bigint', unsigned: true },
          { name: 'logistics_order_code', type: 'varchar', length: '40' },
          { name: 'shipping_demand_id', type: 'bigint', unsigned: true },
          { name: 'shipping_demand_code', type: 'varchar', length: '40' },
          { name: 'sales_order_id', type: 'bigint', unsigned: true },
          { name: 'sales_order_code', type: 'varchar', length: '40' },
          { name: 'outbound_user_id', type: 'bigint', unsigned: true },
          { name: 'outbound_user_name', type: 'varchar', length: '100' },
          { name: 'outbound_date', type: 'date' },
          { name: 'outbound_type', type: 'varchar', length: '40' },
          { name: 'sales_company_id', type: 'bigint', unsigned: true },
          { name: 'sales_company_name', type: 'varchar', length: '200' },
          { name: 'warehouse_id', type: 'bigint', unsigned: true },
          { name: 'warehouse_name', type: 'varchar', length: '200' },
          { name: 'status', type: 'varchar', length: '20' },
          {
            name: 'sales_total_amount',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'cost_total_amount',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          { name: 'remark', type: 'text', isNullable: true },
          {
            name: 'source_action_key',
            type: 'varchar',
            length: '160',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
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

    await queryRunner.createIndices('outbound_orders', [
      new TableIndex({
        name: 'uq_outbound_orders_outbound_code',
        columnNames: ['outbound_code'],
        isUnique: true,
      }),
      new TableIndex({
        name: 'uq_outbound_orders_source_action_key',
        columnNames: ['source_action_key'],
        isUnique: true,
      }),
      new TableIndex({
        name: 'idx_outbound_orders_logistics_order_id',
        columnNames: ['logistics_order_id'],
      }),
      new TableIndex({
        name: 'idx_outbound_orders_shipping_demand_id',
        columnNames: ['shipping_demand_id'],
      }),
      new TableIndex({
        name: 'idx_outbound_orders_sales_order_id',
        columnNames: ['sales_order_id'],
      }),
      new TableIndex({
        name: 'idx_outbound_orders_status',
        columnNames: ['status'],
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'outbound_order_items',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'outbound_order_id', type: 'bigint', unsigned: true },
          { name: 'logistics_order_item_id', type: 'bigint', unsigned: true },
          { name: 'shipping_demand_item_id', type: 'bigint', unsigned: true },
          { name: 'sales_order_item_id', type: 'bigint', unsigned: true },
          { name: 'sku_id', type: 'bigint', unsigned: true },
          { name: 'sku_code', type: 'varchar', length: '100' },
          {
            name: 'product_name_cn',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'product_name_en',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'unit_name',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          { name: 'planned_quantity', type: 'int', default: 0 },
          { name: 'previous_outbound_quantity', type: 'int', default: 0 },
          { name: 'outbound_quantity', type: 'int', default: 0 },
          { name: 'warehouse_id', type: 'bigint', unsigned: true },
          { name: 'warehouse_name', type: 'varchar', length: '200' },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
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

    await queryRunner.createIndices('outbound_order_items', [
      new TableIndex({
        name: 'idx_outbound_order_items_outbound_order_id',
        columnNames: ['outbound_order_id'],
      }),
      new TableIndex({
        name: 'idx_outbound_order_items_logistics_order_item_id',
        columnNames: ['logistics_order_item_id'],
      }),
      new TableIndex({
        name: 'idx_outbound_order_items_shipping_demand_item_id',
        columnNames: ['shipping_demand_item_id'],
      }),
      new TableIndex({
        name: 'idx_outbound_order_items_sku_id',
        columnNames: ['sku_id'],
      }),
      new TableIndex({
        name: 'idx_outbound_order_items_warehouse_id',
        columnNames: ['warehouse_id'],
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'outbound_allocation_consumptions',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'outbound_order_item_id', type: 'bigint', unsigned: true },
          {
            name: 'shipping_demand_allocation_id',
            type: 'bigint',
            unsigned: true,
          },
          { name: 'inventory_batch_id', type: 'bigint', unsigned: true },
          { name: 'consumed_quantity', type: 'int', default: 0 },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
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

    await queryRunner.createIndices('outbound_allocation_consumptions', [
      new TableIndex({
        name: 'idx_outbound_alloc_consumptions_outbound_item_id',
        columnNames: ['outbound_order_item_id'],
      }),
      new TableIndex({
        name: 'idx_outbound_alloc_consumptions_allocation_id',
        columnNames: ['shipping_demand_allocation_id'],
      }),
      new TableIndex({
        name: 'uq_outbound_alloc_consumptions_item_allocation',
        columnNames: [
          'outbound_order_item_id',
          'shipping_demand_allocation_id',
        ],
        isUnique: true,
      }),
    ]);

    await queryRunner.createForeignKeys('outbound_orders', [
      new TableForeignKey({
        name: 'fk_outbound_orders_logistics_order_id',
        columnNames: ['logistics_order_id'],
        referencedTableName: 'logistics_orders',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    ]);

    await queryRunner.createForeignKeys('outbound_order_items', [
      new TableForeignKey({
        name: 'fk_outbound_order_items_outbound_order_id',
        columnNames: ['outbound_order_id'],
        referencedTableName: 'outbound_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'fk_outbound_order_items_logistics_order_item_id',
        columnNames: ['logistics_order_item_id'],
        referencedTableName: 'logistics_order_items',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        name: 'fk_outbound_order_items_shipping_demand_item_id',
        columnNames: ['shipping_demand_item_id'],
        referencedTableName: 'shipping_demand_items',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        name: 'fk_outbound_order_items_warehouse_id',
        columnNames: ['warehouse_id'],
        referencedTableName: 'warehouses',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    ]);

    await queryRunner.createForeignKeys('outbound_allocation_consumptions', [
      new TableForeignKey({
        name: 'fk_outbound_alloc_consumptions_outbound_item_id',
        columnNames: ['outbound_order_item_id'],
        referencedTableName: 'outbound_order_items',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'fk_outbound_alloc_consumptions_allocation_id',
        columnNames: ['shipping_demand_allocation_id'],
        referencedTableName: 'shipping_demand_inventory_allocations',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of [
      'outbound_allocation_consumptions',
      'outbound_order_items',
      'outbound_orders',
    ]) {
      const table = await queryRunner.getTable(tableName);
      if (table) {
        for (const foreignKey of table.foreignKeys) {
          await queryRunner.dropForeignKey(tableName, foreignKey);
        }
      }
    }

    for (const indexName of [
      'idx_outbound_alloc_consumptions_outbound_item_id',
      'idx_outbound_alloc_consumptions_allocation_id',
      'uq_outbound_alloc_consumptions_item_allocation',
    ]) {
      await queryRunner.dropIndex('outbound_allocation_consumptions', indexName);
    }
    await queryRunner.dropTable('outbound_allocation_consumptions');

    for (const indexName of [
      'idx_outbound_order_items_outbound_order_id',
      'idx_outbound_order_items_logistics_order_item_id',
      'idx_outbound_order_items_shipping_demand_item_id',
      'idx_outbound_order_items_sku_id',
      'idx_outbound_order_items_warehouse_id',
    ]) {
      await queryRunner.dropIndex('outbound_order_items', indexName);
    }
    await queryRunner.dropTable('outbound_order_items');

    for (const indexName of [
      'uq_outbound_orders_outbound_code',
      'uq_outbound_orders_source_action_key',
      'idx_outbound_orders_logistics_order_id',
      'idx_outbound_orders_shipping_demand_id',
      'idx_outbound_orders_sales_order_id',
      'idx_outbound_orders_status',
    ]) {
      await queryRunner.dropIndex('outbound_orders', indexName);
    }
    await queryRunner.dropTable('outbound_orders');
  }
}
