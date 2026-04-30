import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddPurchaseSupplierToShippingDemandItems20260429000400
  implements MigrationInterface
{
  name = 'AddPurchaseSupplierToShippingDemandItems20260429000400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('shipping_demand_items', [
      new TableColumn({
        name: 'purchase_supplier_id',
        type: 'bigint',
        unsigned: true,
        isNullable: true,
      }),
      new TableColumn({
        name: 'purchase_supplier_name',
        type: 'varchar',
        length: '200',
        isNullable: true,
      }),
      new TableColumn({
        name: 'purchase_supplier_code',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
      new TableColumn({
        name: 'purchase_supplier_contact_person',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'purchase_supplier_contact_phone',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
      new TableColumn({
        name: 'purchase_supplier_contact_email',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'purchase_supplier_payment_term_name',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    ]);

    await queryRunner.createIndex(
      'shipping_demand_items',
      new TableIndex({
        name: 'idx_shipping_demand_items_purchase_supplier_id',
        columnNames: ['purchase_supplier_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('shipping_demand_items');
    if (
      table?.indices.some(
        (index) =>
          index.name === 'idx_shipping_demand_items_purchase_supplier_id',
      )
    ) {
      await queryRunner.dropIndex(
        'shipping_demand_items',
        'idx_shipping_demand_items_purchase_supplier_id',
      );
    }

    await queryRunner.dropColumns('shipping_demand_items', [
      'purchase_supplier_payment_term_name',
      'purchase_supplier_contact_email',
      'purchase_supplier_contact_phone',
      'purchase_supplier_contact_person',
      'purchase_supplier_code',
      'purchase_supplier_name',
      'purchase_supplier_id',
    ]);
  }
}
