import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateReceiptOrders20260430000200
  implements MigrationInterface
{
  name = 'CreateReceiptOrders20260430000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'receipt_orders',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'receipt_code', type: 'varchar', length: '40' },
          { name: 'purchase_order_id', type: 'bigint', unsigned: true },
          { name: 'purchase_order_code', type: 'varchar', length: '40' },
          { name: 'receipt_type', type: 'varchar', length: '40' },
          { name: 'status', type: 'varchar', length: '20' },
          { name: 'warehouse_id', type: 'bigint', unsigned: true },
          { name: 'warehouse_name', type: 'varchar', length: '200' },
          { name: 'receipt_date', type: 'date' },
          { name: 'receiver_id', type: 'bigint', unsigned: true },
          { name: 'receiver_name', type: 'varchar', length: '100' },
          {
            name: 'shipping_demand_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'shipping_demand_code',
            type: 'varchar',
            length: '40',
            isNullable: true,
          },
          {
            name: 'purchase_company_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'purchase_company_name',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          { name: 'total_quantity', type: 'int', default: 0 },
          {
            name: 'total_amount',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          { name: 'remark', type: 'text', isNullable: true },
          {
            name: 'inventory_note',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'source_action_key',
            type: 'varchar',
            length: '160',
            isNullable: true,
          },
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

    await queryRunner.createIndices('receipt_orders', [
      new TableIndex({
        name: 'uq_receipt_orders_receipt_code',
        columnNames: ['receipt_code'],
        isUnique: true,
      }),
      new TableIndex({
        name: 'idx_receipt_orders_purchase_order_id',
        columnNames: ['purchase_order_id'],
      }),
      new TableIndex({
        name: 'idx_receipt_orders_receipt_date',
        columnNames: ['receipt_date'],
      }),
      new TableIndex({
        name: 'idx_receipt_orders_source_action_key',
        columnNames: ['source_action_key'],
        isUnique: true,
      }),
    ]);

    await queryRunner.createForeignKeys('receipt_orders', [
      new TableForeignKey({
        columnNames: ['purchase_order_id'],
        referencedTableName: 'purchase_orders',
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
        columnNames: ['receiver_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        columnNames: ['shipping_demand_id'],
        referencedTableName: 'shipping_demands',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['purchase_company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'receipt_order_items',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'receipt_order_id', type: 'bigint', unsigned: true },
          { name: 'purchase_order_id', type: 'bigint', unsigned: true },
          { name: 'purchase_order_item_id', type: 'bigint', unsigned: true },
          {
            name: 'shipping_demand_item_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
          },
          { name: 'sku_id', type: 'bigint', unsigned: true },
          { name: 'sku_code', type: 'varchar', length: '100' },
          {
            name: 'product_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'product_category_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          { name: 'received_quantity', type: 'int', default: 0 },
          { name: 'qc_image_keys', type: 'json', isNullable: true },
          {
            name: 'unit_price',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          { name: 'warehouse_id', type: 'bigint', unsigned: true },
          { name: 'warehouse_name', type: 'varchar', length: '200' },
          {
            name: 'inventory_batch_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
          },
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

    await queryRunner.createIndices('receipt_order_items', [
      new TableIndex({
        name: 'idx_receipt_order_items_receipt_order_id',
        columnNames: ['receipt_order_id'],
      }),
      new TableIndex({
        name: 'idx_receipt_order_items_purchase_order_item_id',
        columnNames: ['purchase_order_item_id'],
      }),
      new TableIndex({
        name: 'idx_receipt_order_items_sku_id',
        columnNames: ['sku_id'],
      }),
      new TableIndex({
        name: 'idx_receipt_order_items_warehouse_id',
        columnNames: ['warehouse_id'],
      }),
    ]);

    await queryRunner.createForeignKeys('receipt_order_items', [
      new TableForeignKey({
        columnNames: ['receipt_order_id'],
        referencedTableName: 'receipt_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['purchase_order_id'],
        referencedTableName: 'purchase_orders',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        columnNames: ['purchase_order_item_id'],
        referencedTableName: 'purchase_order_items',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        columnNames: ['shipping_demand_item_id'],
        referencedTableName: 'shipping_demand_items',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
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
        onDelete: 'SET NULL',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('receipt_order_items');
    await queryRunner.dropTable('receipt_orders');
  }
}
