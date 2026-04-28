import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateShippingDemandsTable20260428000100
  implements MigrationInterface
{
  name = 'CreateShippingDemandsTable20260428000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'shipping_demands',
        columns: [
          { name: 'id', type: 'bigint', unsigned: true, isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'demand_code', type: 'varchar', length: '40' },
          { name: 'sales_order_id', type: 'bigint', unsigned: true },
          { name: 'source_document_code', type: 'varchar', length: '32' },
          { name: 'source_document_type', type: 'varchar', length: '40', default: "'sales_order'" },
          { name: 'status', type: 'varchar', length: '30' },
          { name: 'order_type', type: 'varchar', length: '30' },
          { name: 'domestic_trade_type', type: 'varchar', length: '20' },
          { name: 'customer_id', type: 'bigint', unsigned: true },
          { name: 'customer_name', type: 'varchar', length: '200' },
          { name: 'customer_code', type: 'varchar', length: '50' },
          { name: 'currency_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'currency_code', type: 'varchar', length: '20', isNullable: true },
          { name: 'currency_name', type: 'varchar', length: '50', isNullable: true },
          { name: 'currency_symbol', type: 'varchar', length: '20', isNullable: true },
          { name: 'trade_term', type: 'varchar', length: '10', isNullable: true },
          { name: 'payment_term', type: 'varchar', length: '80', isNullable: true },
          { name: 'shipment_origin_country_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'shipment_origin_country_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'destination_country_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'destination_country_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'destination_port_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'destination_port_name', type: 'varchar', length: '200', isNullable: true },
          { name: 'signing_company_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'signing_company_name', type: 'varchar', length: '200', isNullable: true },
          { name: 'salesperson_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'salesperson_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'merchandiser_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'merchandiser_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'merchandiser_abbr', type: 'varchar', length: '20', isNullable: true },
          { name: 'order_nature', type: 'varchar', length: '40', isNullable: true },
          { name: 'receipt_status', type: 'varchar', length: '30', isNullable: true },
          { name: 'transportation_method', type: 'varchar', length: '30', isNullable: true },
          { name: 'required_delivery_at', type: 'date', isNullable: true },
          { name: 'is_shared_order', type: 'varchar', length: '10', isNullable: true },
          { name: 'is_sinosure', type: 'varchar', length: '10', isNullable: true },
          { name: 'is_ali_trade_assurance', type: 'varchar', length: '10', isNullable: true },
          { name: 'is_insured', type: 'varchar', length: '10', isNullable: true },
          { name: 'is_palletized', type: 'varchar', length: '10', isNullable: true },
          { name: 'requires_export_customs', type: 'varchar', length: '10', isNullable: true },
          { name: 'requires_warranty_card', type: 'varchar', length: '10', isNullable: true },
          { name: 'requires_customs_certificate', type: 'varchar', length: '10', isNullable: true },
          { name: 'uses_marketing_fund', type: 'varchar', length: '10', isNullable: true },
          { name: 'contract_amount', type: 'decimal', precision: 18, scale: 2, default: 0 },
          { name: 'received_amount', type: 'decimal', precision: 18, scale: 2, default: 0 },
          { name: 'outstanding_amount', type: 'decimal', precision: 18, scale: 2, default: 0 },
          { name: 'total_amount', type: 'decimal', precision: 18, scale: 2, default: 0 },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
          { name: 'created_by', type: 'varchar', length: '100', isNullable: true },
          { name: 'updated_by', type: 'varchar', length: '100', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndices('shipping_demands', [
      new TableIndex({ name: 'uq_shipping_demands_demand_code', columnNames: ['demand_code'], isUnique: true }),
      new TableIndex({ name: 'idx_shipping_demands_sales_order_id', columnNames: ['sales_order_id'] }),
      new TableIndex({ name: 'idx_shipping_demands_status', columnNames: ['status'] }),
      new TableIndex({ name: 'idx_shipping_demands_created_at', columnNames: ['created_at'] }),
    ]);

    await queryRunner.createForeignKeys('shipping_demands', [
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
        columnNames: ['currency_id'],
        referencedTableName: 'currencies',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['shipment_origin_country_id'],
        referencedTableName: 'countries',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['destination_country_id'],
        referencedTableName: 'countries',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['destination_port_id'],
        referencedTableName: 'ports',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['signing_company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['salesperson_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['merchandiser_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'shipping_demand_items',
        columns: [
          { name: 'id', type: 'bigint', unsigned: true, isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'shipping_demand_id', type: 'bigint', unsigned: true },
          { name: 'sales_order_item_id', type: 'bigint', unsigned: true },
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
          { name: 'unit_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'unit_name', type: 'varchar', length: '50', isNullable: true },
          { name: 'required_quantity', type: 'int', default: 0 },
          { name: 'available_stock_snapshot', type: 'json', isNullable: true },
          { name: 'fulfillment_type', type: 'varchar', length: '30', isNullable: true },
          { name: 'stock_required_quantity', type: 'int', default: 0 },
          { name: 'purchase_required_quantity', type: 'int', default: 0 },
          { name: 'locked_remaining_quantity', type: 'int', default: 0 },
          { name: 'shipped_quantity', type: 'int', default: 0 },
          { name: 'purchase_ordered_quantity', type: 'int', default: 0 },
          { name: 'received_quantity', type: 'int', default: 0 },
          { name: 'amount', type: 'decimal', precision: 18, scale: 2, default: 0 },
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

    await queryRunner.createIndices('shipping_demand_items', [
      new TableIndex({ name: 'idx_shipping_demand_items_demand_id', columnNames: ['shipping_demand_id'] }),
      new TableIndex({ name: 'idx_shipping_demand_items_sales_order_item_id', columnNames: ['sales_order_item_id'] }),
      new TableIndex({ name: 'idx_shipping_demand_items_sku_id', columnNames: ['sku_id'] }),
    ]);

    await queryRunner.createForeignKeys('shipping_demand_items', [
      new TableForeignKey({
        columnNames: ['shipping_demand_id'],
        referencedTableName: 'shipping_demands',
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
      }),
      new TableForeignKey({
        columnNames: ['currency_id'],
        referencedTableName: 'currencies',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['unit_id'],
        referencedTableName: 'units',
        referencedColumnNames: ['id'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('shipping_demand_items');
    await queryRunner.dropTable('shipping_demands');
  }
}
