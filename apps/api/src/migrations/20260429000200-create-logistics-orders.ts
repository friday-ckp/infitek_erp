import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateLogisticsOrders20260429000200 implements MigrationInterface {
  name = 'CreateLogisticsOrders20260429000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'logistics_orders',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'order_code', type: 'varchar', length: '40' },
          { name: 'shipping_demand_id', type: 'bigint', unsigned: true },
          { name: 'shipping_demand_code', type: 'varchar', length: '40' },
          { name: 'sales_order_id', type: 'bigint', unsigned: true },
          { name: 'sales_order_code', type: 'varchar', length: '32' },
          { name: 'status', type: 'varchar', length: '30' },
          { name: 'customer_id', type: 'bigint', unsigned: true },
          { name: 'customer_name', type: 'varchar', length: '200' },
          { name: 'customer_code', type: 'varchar', length: '50' },
          { name: 'domestic_trade_type', type: 'varchar', length: '20' },
          { name: 'logistics_provider_id', type: 'bigint', unsigned: true },
          { name: 'logistics_provider_name', type: 'varchar', length: '200' },
          { name: 'transportation_method', type: 'varchar', length: '30' },
          { name: 'company_id', type: 'bigint', unsigned: true },
          { name: 'company_name', type: 'varchar', length: '200' },
          {
            name: 'origin_port_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
          },
          { name: 'origin_port_name', type: 'varchar', length: '200' },
          {
            name: 'destination_port_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
          },
          { name: 'destination_port_name', type: 'varchar', length: '200' },
          {
            name: 'destination_country_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
          },
          { name: 'destination_country_name', type: 'varchar', length: '100' },
          { name: 'required_delivery_at', type: 'date', isNullable: true },
          {
            name: 'requires_export_customs',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          { name: 'consignee_company', type: 'text', isNullable: true },
          { name: 'consignee_other_info', type: 'text', isNullable: true },
          { name: 'notify_company', type: 'text', isNullable: true },
          { name: 'notify_other_info', type: 'text', isNullable: true },
          { name: 'shipper_company', type: 'text', isNullable: true },
          {
            name: 'shipper_other_info_company_name',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'uses_default_shipping_mark',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'shipping_mark_note',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'needs_invoice',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'invoice_type',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'shipping_documents_note',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          { name: 'bl_type', type: 'varchar', length: '30', isNullable: true },
          { name: 'original_mail_address', type: 'text', isNullable: true },
          { name: 'customs_document_note', type: 'text', isNullable: true },
          { name: 'other_requirement_note', type: 'text', isNullable: true },
          { name: 'remarks', type: 'text', isNullable: true },
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

    await queryRunner.createIndices('logistics_orders', [
      new TableIndex({
        name: 'uq_logistics_orders_order_code',
        columnNames: ['order_code'],
        isUnique: true,
      }),
      new TableIndex({
        name: 'idx_logistics_orders_shipping_demand_id',
        columnNames: ['shipping_demand_id'],
      }),
      new TableIndex({
        name: 'idx_logistics_orders_sales_order_id',
        columnNames: ['sales_order_id'],
      }),
      new TableIndex({
        name: 'idx_logistics_orders_status',
        columnNames: ['status'],
      }),
      new TableIndex({
        name: 'idx_logistics_orders_provider_id',
        columnNames: ['logistics_provider_id'],
      }),
    ]);

    await queryRunner.createForeignKeys('logistics_orders', [
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
        columnNames: ['customer_id'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['logistics_provider_id'],
        referencedTableName: 'logistics_providers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        columnNames: ['origin_port_id'],
        referencedTableName: 'ports',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['destination_port_id'],
        referencedTableName: 'ports',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['destination_country_id'],
        referencedTableName: 'countries',
        referencedColumnNames: ['id'],
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'logistics_order_items',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'logistics_order_id', type: 'bigint', unsigned: true },
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
          { name: 'locked_remaining_quantity', type: 'int', default: 0 },
          { name: 'planned_quantity', type: 'int', default: 0 },
          { name: 'outbound_quantity', type: 'int', default: 0 },
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

    await queryRunner.createIndices('logistics_order_items', [
      new TableIndex({
        name: 'idx_logistics_order_items_order_id',
        columnNames: ['logistics_order_id'],
      }),
      new TableIndex({
        name: 'idx_logistics_order_items_demand_item_id',
        columnNames: ['shipping_demand_item_id'],
      }),
      new TableIndex({
        name: 'idx_logistics_order_items_sku_id',
        columnNames: ['sku_id'],
      }),
    ]);

    await queryRunner.createForeignKeys('logistics_order_items', [
      new TableForeignKey({
        columnNames: ['logistics_order_id'],
        referencedTableName: 'logistics_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
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

    await queryRunner.createTable(
      new Table({
        name: 'logistics_order_packages',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'logistics_order_id', type: 'bigint', unsigned: true },
          { name: 'package_no', type: 'varchar', length: '80' },
          { name: 'quantity_per_box', type: 'int', default: 0 },
          { name: 'box_count', type: 'int', default: 0 },
          { name: 'total_quantity', type: 'int', default: 0 },
          {
            name: 'length_cm',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'width_cm',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'height_cm',
            type: 'decimal',
            precision: 18,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'gross_weight_kg',
            type: 'decimal',
            precision: 18,
            scale: 3,
            isNullable: true,
          },
          { name: 'remarks', type: 'varchar', length: '255', isNullable: true },
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

    await queryRunner.createIndex(
      'logistics_order_packages',
      new TableIndex({
        name: 'idx_logistics_order_packages_order_id',
        columnNames: ['logistics_order_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'logistics_order_packages',
      new TableForeignKey({
        columnNames: ['logistics_order_id'],
        referencedTableName: 'logistics_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('logistics_order_packages');
    await queryRunner.dropTable('logistics_order_items');
    await queryRunner.dropTable('logistics_orders');
  }
}
