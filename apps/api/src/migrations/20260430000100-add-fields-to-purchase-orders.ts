import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

const purchaseOrderColumns: TableColumn[] = [
  new TableColumn({
    name: 'supplier_code',
    type: 'varchar',
    length: '50',
    isNullable: true,
  }),
  new TableColumn({
    name: 'supplier_name_text',
    type: 'varchar',
    length: '200',
    isNullable: true,
  }),
  new TableColumn({
    name: 'supplier_address',
    type: 'varchar',
    length: '500',
    isNullable: true,
  }),
  new TableColumn({ name: 'po_delivery_date', type: 'date', isNullable: true }),
  new TableColumn({ name: 'arrival_date', type: 'date', isNullable: true }),
  new TableColumn({
    name: 'is_prepaid',
    type: 'varchar',
    length: '10',
    isNullable: true,
  }),
  new TableColumn({ name: 'prepaid_ratio', type: 'int', isNullable: true }),
  new TableColumn({ name: 'plug_photo_keys', type: 'json', isNullable: true }),
  new TableColumn({
    name: 'purchase_company_id',
    type: 'bigint',
    unsigned: true,
    isNullable: true,
  }),
  new TableColumn({
    name: 'purchase_company_name',
    type: 'varchar',
    length: '200',
    isNullable: true,
  }),
  new TableColumn({
    name: 'company_address_cn',
    type: 'text',
    isNullable: true,
  }),
  new TableColumn({
    name: 'company_signing_location',
    type: 'varchar',
    length: '200',
    isNullable: true,
  }),
  new TableColumn({
    name: 'company_contact_person',
    type: 'varchar',
    length: '100',
    isNullable: true,
  }),
  new TableColumn({
    name: 'company_contact_phone',
    type: 'varchar',
    length: '50',
    isNullable: true,
  }),
  new TableColumn({
    name: 'contract_template_id_text',
    type: 'varchar',
    length: '80',
    isNullable: true,
  }),
  new TableColumn({
    name: 'application_type',
    type: 'varchar',
    length: '30',
    isNullable: true,
  }),
  new TableColumn({
    name: 'demand_type',
    type: 'varchar',
    length: '40',
    isNullable: true,
  }),
  new TableColumn({ name: 'currency_id', type: 'bigint', isNullable: true }),
  new TableColumn({
    name: 'currency_code',
    type: 'varchar',
    length: '20',
    isNullable: true,
  }),
  new TableColumn({
    name: 'currency_name',
    type: 'varchar',
    length: '50',
    isNullable: true,
  }),
  new TableColumn({
    name: 'currency_symbol',
    type: 'varchar',
    length: '20',
    isNullable: true,
  }),
  new TableColumn({
    name: 'settlement_date_type',
    type: 'varchar',
    length: '30',
    isNullable: true,
  }),
  new TableColumn({
    name: 'settlement_type',
    type: 'varchar',
    length: '30',
    isNullable: true,
  }),
  new TableColumn({ name: 'purchaser_id', type: 'bigint', isNullable: true }),
  new TableColumn({
    name: 'purchaser_name',
    type: 'varchar',
    length: '100',
    isNullable: true,
  }),
  new TableColumn({
    name: 'salesperson_name',
    type: 'varchar',
    length: '100',
    isNullable: true,
  }),
  new TableColumn({ name: 'purchase_date', type: 'date', isNullable: true }),
  new TableColumn({ name: 'total_quantity', type: 'int', default: 0 }),
  new TableColumn({
    name: 'paid_amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  }),
  new TableColumn({ name: 'received_total_quantity', type: 'int', default: 0 }),
  new TableColumn({
    name: 'receipt_status',
    type: 'varchar',
    length: '30',
    default: "'not_received'",
  }),
  new TableColumn({
    name: 'is_fully_paid',
    type: 'varchar',
    length: '10',
    isNullable: true,
  }),
  new TableColumn({
    name: 'supplier_stamped_contract_keys',
    type: 'json',
    isNullable: true,
  }),
  new TableColumn({
    name: 'both_stamped_contract_keys',
    type: 'json',
    isNullable: true,
  }),
  new TableColumn({
    name: 'supplier_contract_uploaded',
    type: 'varchar',
    length: '10',
    isNullable: true,
  }),
  new TableColumn({
    name: 'both_contract_uploaded',
    type: 'varchar',
    length: '10',
    isNullable: true,
  }),
  new TableColumn({
    name: 'business_rectification_requirement',
    type: 'text',
    isNullable: true,
  }),
  new TableColumn({
    name: 'commercial_rectification_requirement',
    type: 'text',
    isNullable: true,
  }),
  new TableColumn({
    name: 'form_error_message',
    type: 'varchar',
    length: '500',
    isNullable: true,
  }),
  new TableColumn({
    name: 'invoice_completed_at',
    type: 'date',
    isNullable: true,
  }),
  new TableColumn({
    name: 'payment_completed_at',
    type: 'date',
    isNullable: true,
  }),
];

const purchaseOrderItemColumns: TableColumn[] = [
  new TableColumn({
    name: 'product_type',
    type: 'varchar',
    length: '100',
    isNullable: true,
  }),
  new TableColumn({
    name: 'manufacturer_model',
    type: 'varchar',
    length: '200',
    isNullable: true,
  }),
  new TableColumn({
    name: 'plug_type',
    type: 'varchar',
    length: '50',
    isNullable: true,
  }),
  new TableColumn({
    name: 'list_price',
    type: 'decimal',
    precision: 18,
    scale: 2,
    isNullable: true,
  }),
  new TableColumn({
    name: 'is_invoiced',
    type: 'varchar',
    length: '10',
    isNullable: true,
  }),
  new TableColumn({
    name: 'is_fully_received',
    type: 'varchar',
    length: '10',
    isNullable: true,
  }),
  new TableColumn({
    name: 'spu_id',
    type: 'bigint',
    unsigned: true,
    isNullable: true,
  }),
  new TableColumn({
    name: 'spu_name',
    type: 'varchar',
    length: '255',
    isNullable: true,
  }),
  new TableColumn({
    name: 'electrical_params',
    type: 'text',
    isNullable: true,
  }),
  new TableColumn({ name: 'core_params', type: 'text', isNullable: true }),
  new TableColumn({
    name: 'has_plug_text',
    type: 'varchar',
    length: '30',
    isNullable: true,
  }),
  new TableColumn({
    name: 'special_attribute_note',
    type: 'text',
    isNullable: true,
  }),
];

export class AddFieldsToPurchaseOrders20260430000100 implements MigrationInterface {
  name = 'AddFieldsToPurchaseOrders20260430000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('purchase_orders', purchaseOrderColumns);
    await queryRunner.addColumns(
      'purchase_order_items',
      purchaseOrderItemColumns,
    );
    await queryRunner.createIndices('purchase_orders', [
      new TableIndex({
        name: 'idx_purchase_orders_application_type',
        columnNames: ['application_type'],
      }),
      new TableIndex({
        name: 'idx_purchase_orders_demand_type',
        columnNames: ['demand_type'],
      }),
      new TableIndex({
        name: 'idx_purchase_orders_receipt_status',
        columnNames: ['receipt_status'],
      }),
      new TableIndex({
        name: 'idx_purchase_orders_purchase_date',
        columnNames: ['purchase_date'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'purchase_orders',
      'idx_purchase_orders_purchase_date',
    );
    await queryRunner.dropIndex(
      'purchase_orders',
      'idx_purchase_orders_receipt_status',
    );
    await queryRunner.dropIndex(
      'purchase_orders',
      'idx_purchase_orders_demand_type',
    );
    await queryRunner.dropIndex(
      'purchase_orders',
      'idx_purchase_orders_application_type',
    );
    await queryRunner.dropColumns(
      'purchase_order_items',
      purchaseOrderItemColumns.map((column) => column.name),
    );
    await queryRunner.dropColumns(
      'purchase_orders',
      purchaseOrderColumns.map((column) => column.name),
    );
  }
}
