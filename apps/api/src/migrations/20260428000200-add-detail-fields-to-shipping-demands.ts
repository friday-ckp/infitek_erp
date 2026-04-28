import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddDetailFieldsToShippingDemands20260428000200
  implements MigrationInterface
{
  name = 'AddDetailFieldsToShippingDemands20260428000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('shipping_demands', [
      new TableColumn({ name: 'order_source', type: 'varchar', length: '30', isNullable: true }),
      new TableColumn({ name: 'external_order_code', type: 'varchar', length: '100', isNullable: true }),
      new TableColumn({ name: 'customer_contact_person', type: 'varchar', length: '100', isNullable: true }),
      new TableColumn({ name: 'after_sales_source_order_id', type: 'bigint', unsigned: true, isNullable: true }),
      new TableColumn({ name: 'after_sales_source_order_code', type: 'varchar', length: '32', isNullable: true }),
      new TableColumn({ name: 'after_sales_product_summary', type: 'text', isNullable: true }),
      new TableColumn({ name: 'bank_account', type: 'varchar', length: '255', isNullable: true }),
      new TableColumn({ name: 'extra_viewer_id', type: 'bigint', unsigned: true, isNullable: true }),
      new TableColumn({ name: 'extra_viewer_name', type: 'varchar', length: '100', isNullable: true }),
      new TableColumn({ name: 'primary_industry', type: 'varchar', length: '50', isNullable: true }),
      new TableColumn({ name: 'secondary_industry', type: 'varchar', length: '50', isNullable: true }),
      new TableColumn({ name: 'exchange_rate', type: 'decimal', precision: 18, scale: 6, isNullable: true }),
      new TableColumn({ name: 'crm_signed_at', type: 'date', isNullable: true }),
      new TableColumn({ name: 'is_split_in_advance', type: 'varchar', length: '10', isNullable: true }),
      new TableColumn({ name: 'requires_maternity_handover', type: 'varchar', length: '10', isNullable: true }),
      new TableColumn({ name: 'customs_declaration_method', type: 'varchar', length: '30', isNullable: true }),
      new TableColumn({ name: 'ali_trade_assurance_order_code', type: 'varchar', length: '100', isNullable: true }),
      new TableColumn({ name: 'forwarder_quote_note', type: 'text', isNullable: true }),
      new TableColumn({ name: 'contract_file_keys', type: 'json', isNullable: true }),
      new TableColumn({ name: 'contract_file_names', type: 'json', isNullable: true }),
      new TableColumn({ name: 'plug_photo_keys', type: 'json', isNullable: true }),
      new TableColumn({ name: 'consignee_company', type: 'text', isNullable: true }),
      new TableColumn({ name: 'consignee_other_info', type: 'text', isNullable: true }),
      new TableColumn({ name: 'notify_company', type: 'text', isNullable: true }),
      new TableColumn({ name: 'notify_other_info', type: 'text', isNullable: true }),
      new TableColumn({ name: 'shipper_company', type: 'text', isNullable: true }),
      new TableColumn({ name: 'shipper_other_info_company_id', type: 'bigint', unsigned: true, isNullable: true }),
      new TableColumn({ name: 'shipper_other_info_company_name', type: 'varchar', length: '200', isNullable: true }),
      new TableColumn({ name: 'domestic_customer_company', type: 'text', isNullable: true }),
      new TableColumn({ name: 'domestic_customer_delivery_info', type: 'text', isNullable: true }),
      new TableColumn({ name: 'uses_default_shipping_mark', type: 'varchar', length: '10', isNullable: true }),
      new TableColumn({ name: 'shipping_mark_note', type: 'varchar', length: '255', isNullable: true }),
      new TableColumn({ name: 'shipping_mark_template_key', type: 'varchar', length: '255', isNullable: true }),
      new TableColumn({ name: 'needs_invoice', type: 'varchar', length: '10', isNullable: true }),
      new TableColumn({ name: 'invoice_type', type: 'varchar', length: '30', isNullable: true }),
      new TableColumn({ name: 'shipping_documents_note', type: 'varchar', length: '500', isNullable: true }),
      new TableColumn({ name: 'bl_type', type: 'varchar', length: '30', isNullable: true }),
      new TableColumn({ name: 'original_mail_address', type: 'text', isNullable: true }),
      new TableColumn({ name: 'business_rectification_note', type: 'text', isNullable: true }),
      new TableColumn({ name: 'customs_document_note', type: 'text', isNullable: true }),
      new TableColumn({ name: 'other_requirement_note', type: 'text', isNullable: true }),
      new TableColumn({ name: 'product_total_amount', type: 'decimal', precision: 18, scale: 2, default: 0 }),
      new TableColumn({ name: 'expense_total_amount', type: 'decimal', precision: 18, scale: 2, default: 0 }),
    ]);

    await queryRunner.addColumns('shipping_demand_items', [
      new TableColumn({ name: 'purchaser_id', type: 'bigint', unsigned: true, isNullable: true }),
      new TableColumn({ name: 'purchaser_name', type: 'varchar', length: '100', isNullable: true }),
      new TableColumn({ name: 'needs_purchase', type: 'varchar', length: '10', isNullable: true }),
    ]);

    await queryRunner.createForeignKeys('shipping_demands', [
      new TableForeignKey({
        columnNames: ['after_sales_source_order_id'],
        referencedTableName: 'sales_orders',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['extra_viewer_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['shipper_other_info_company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
      }),
    ]);

    await queryRunner.createForeignKey(
      'shipping_demand_items',
      new TableForeignKey({
        columnNames: ['purchaser_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const demandTable = await queryRunner.getTable('shipping_demands');
    const itemTable = await queryRunner.getTable('shipping_demand_items');

    for (const columnName of [
      'after_sales_source_order_id',
      'extra_viewer_id',
      'shipper_other_info_company_id',
    ]) {
      const foreignKey = demandTable?.foreignKeys.find((key) =>
        key.columnNames.includes(columnName),
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('shipping_demands', foreignKey);
      }
    }

    const purchaserForeignKey = itemTable?.foreignKeys.find((key) =>
      key.columnNames.includes('purchaser_id'),
    );
    if (purchaserForeignKey) {
      await queryRunner.dropForeignKey(
        'shipping_demand_items',
        purchaserForeignKey,
      );
    }

    await queryRunner.dropColumns('shipping_demand_items', [
      'purchaser_id',
      'purchaser_name',
      'needs_purchase',
    ]);

    await queryRunner.dropColumns('shipping_demands', [
      'order_source',
      'external_order_code',
      'customer_contact_person',
      'after_sales_source_order_id',
      'after_sales_source_order_code',
      'after_sales_product_summary',
      'bank_account',
      'extra_viewer_id',
      'extra_viewer_name',
      'primary_industry',
      'secondary_industry',
      'exchange_rate',
      'crm_signed_at',
      'is_split_in_advance',
      'requires_maternity_handover',
      'customs_declaration_method',
      'ali_trade_assurance_order_code',
      'forwarder_quote_note',
      'contract_file_keys',
      'contract_file_names',
      'plug_photo_keys',
      'consignee_company',
      'consignee_other_info',
      'notify_company',
      'notify_other_info',
      'shipper_company',
      'shipper_other_info_company_id',
      'shipper_other_info_company_name',
      'domestic_customer_company',
      'domestic_customer_delivery_info',
      'uses_default_shipping_mark',
      'shipping_mark_note',
      'shipping_mark_template_key',
      'needs_invoice',
      'invoice_type',
      'shipping_documents_note',
      'bl_type',
      'original_mail_address',
      'business_rectification_note',
      'customs_document_note',
      'other_requirement_note',
      'product_total_amount',
      'expense_total_amount',
    ]);
  }
}
