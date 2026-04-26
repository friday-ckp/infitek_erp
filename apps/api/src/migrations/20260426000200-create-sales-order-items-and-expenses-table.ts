import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateSalesOrderItemsAndExpensesTable20260426000200 implements MigrationInterface {
  name = 'CreateSalesOrderItemsAndExpensesTable20260426000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sales_order_items',
        columns: [
          { name: 'id', type: 'bigint', unsigned: true, isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'sales_order_id', type: 'bigint', unsigned: true },
          { name: 'sku_id', type: 'bigint', unsigned: true },
          { name: 'sku_code', type: 'varchar', length: '100' },
          { name: 'product_name_cn', type: 'varchar', length: '255', isNullable: true },
          { name: 'product_name_en', type: 'varchar', length: '255', isNullable: true },
          { name: 'line_type', type: 'varchar', length: '20', isNullable: true },
          { name: 'spu_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'spu_name', type: 'varchar', length: '255', isNullable: true },
          { name: 'electrical_params', type: 'text', isNullable: true },
          { name: 'has_plug', type: 'varchar', length: '10', isNullable: true },
          { name: 'plug_type', type: 'varchar', length: '20', isNullable: true },
          { name: 'unit_price', type: 'decimal', precision: 18, scale: 2, default: 0 },
          { name: 'currency_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'currency_code', type: 'varchar', length: '20', isNullable: true },
          { name: 'quantity', type: 'int', default: 0 },
          { name: 'purchaser_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'purchaser_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'needs_purchase', type: 'varchar', length: '10', isNullable: true },
          { name: 'purchase_quantity', type: 'int', default: 0 },
          { name: 'use_stock_quantity', type: 'int', default: 0 },
          { name: 'prepared_quantity', type: 'int', default: 0 },
          { name: 'shipped_quantity', type: 'int', default: 0 },
          { name: 'amount', type: 'decimal', precision: 18, scale: 2, default: 0 },
          { name: 'unit_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'unit_name', type: 'varchar', length: '50', isNullable: true },
          { name: 'material', type: 'varchar', length: '255', isNullable: true },
          { name: 'image_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'total_volume_cbm', type: 'decimal', precision: 18, scale: 4, default: 0 },
          { name: 'total_weight_kg', type: 'decimal', precision: 18, scale: 4, default: 0 },
          { name: 'unit_weight_kg', type: 'decimal', precision: 18, scale: 4, default: 0 },
          { name: 'unit_volume_cbm', type: 'decimal', precision: 18, scale: 4, default: 0 },
          { name: 'sku_specification', type: 'varchar', length: '255', isNullable: true },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
          { name: 'created_by', type: 'varchar', length: '100', isNullable: true },
          { name: 'updated_by', type: 'varchar', length: '100', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('sales_order_items', [
      new TableIndex({ name: 'idx_sales_order_items_order_id', columnNames: ['sales_order_id'] }),
      new TableIndex({ name: 'idx_sales_order_items_sku_id', columnNames: ['sku_id'] }),
    ]);

    await queryRunner.createForeignKeys('sales_order_items', [
      new TableForeignKey({
        columnNames: ['sales_order_id'],
        referencedTableName: 'sales_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['sku_id'],
        referencedTableName: 'skus',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['currency_id'],
        referencedTableName: 'currencies',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['purchaser_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'sales_order_expenses',
        columns: [
          { name: 'id', type: 'bigint', unsigned: true, isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'sales_order_id', type: 'bigint', unsigned: true },
          { name: 'expense_name', type: 'varchar', length: '255' },
          { name: 'amount', type: 'decimal', precision: 18, scale: 2, default: 0 },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
          { name: 'created_by', type: 'varchar', length: '100', isNullable: true },
          { name: 'updated_by', type: 'varchar', length: '100', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'sales_order_expenses',
      new TableIndex({ name: 'idx_sales_order_expenses_order_id', columnNames: ['sales_order_id'] }),
    );

    await queryRunner.createForeignKey(
      'sales_order_expenses',
      new TableForeignKey({
        columnNames: ['sales_order_id'],
        referencedTableName: 'sales_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sales_order_expenses');
    await queryRunner.dropTable('sales_order_items');
  }
}
