import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatePurchaseOrders20260429000300
  implements MigrationInterface
{
  name = 'CreatePurchaseOrders20260429000300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'purchase_orders',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'po_code', type: 'varchar', length: '40' },
          { name: 'supplier_id', type: 'bigint', unsigned: true },
          { name: 'supplier_name', type: 'varchar', length: '200' },
          {
            name: 'supplier_contact_person',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'supplier_contact_phone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'supplier_contact_email',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'supplier_payment_term_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
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
            name: 'sales_order_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'sales_order_code',
            type: 'varchar',
            length: '32',
            isNullable: true,
          },
          {
            name: 'contract_term_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'contract_term_name',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          { name: 'order_type', type: 'varchar', length: '30' },
          { name: 'status', type: 'varchar', length: '30' },
          {
            name: 'total_amount',
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

    await queryRunner.createIndices('purchase_orders', [
      new TableIndex({
        name: 'uq_purchase_orders_po_code',
        columnNames: ['po_code'],
        isUnique: true,
      }),
      new TableIndex({
        name: 'idx_purchase_orders_supplier_id',
        columnNames: ['supplier_id'],
      }),
      new TableIndex({
        name: 'idx_purchase_orders_shipping_demand_id',
        columnNames: ['shipping_demand_id'],
      }),
      new TableIndex({
        name: 'idx_purchase_orders_status',
        columnNames: ['status'],
      }),
      new TableIndex({
        name: 'idx_purchase_orders_source_action_key',
        columnNames: ['source_action_key'],
        isUnique: true,
      }),
    ]);

    await queryRunner.createForeignKeys('purchase_orders', [
      new TableForeignKey({
        columnNames: ['supplier_id'],
        referencedTableName: 'suppliers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        columnNames: ['shipping_demand_id'],
        referencedTableName: 'shipping_demands',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        columnNames: ['sales_order_id'],
        referencedTableName: 'sales_orders',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        columnNames: ['contract_term_id'],
        referencedTableName: 'contract_templates',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'purchase_order_items',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'purchase_order_id', type: 'bigint', unsigned: true },
          {
            name: 'shipping_demand_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'shipping_demand_item_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'sales_order_item_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
          },
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
            name: 'sku_specification',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          { name: 'unit_id', type: 'bigint', unsigned: true, isNullable: true },
          {
            name: 'unit_name',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          { name: 'quantity', type: 'int', default: 0 },
          { name: 'received_quantity', type: 'int', default: 0 },
          {
            name: 'unit_price',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
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

    await queryRunner.createIndices('purchase_order_items', [
      new TableIndex({
        name: 'idx_purchase_order_items_order_id',
        columnNames: ['purchase_order_id'],
      }),
      new TableIndex({
        name: 'idx_purchase_order_items_demand_item_id',
        columnNames: ['shipping_demand_item_id'],
      }),
      new TableIndex({
        name: 'idx_purchase_order_items_sku_id',
        columnNames: ['sku_id'],
      }),
    ]);

    await queryRunner.createForeignKeys('purchase_order_items', [
      new TableForeignKey({
        columnNames: ['purchase_order_id'],
        referencedTableName: 'purchase_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['shipping_demand_id'],
        referencedTableName: 'shipping_demands',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        columnNames: ['shipping_demand_item_id'],
        referencedTableName: 'shipping_demand_items',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
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
        columnNames: ['unit_id'],
        referencedTableName: 'units',
        referencedColumnNames: ['id'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('purchase_order_items');
    await queryRunner.dropTable('purchase_orders');
  }
}
