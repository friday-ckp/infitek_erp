import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOrderSourceToSalesOrders20260426000300 implements MigrationInterface {
  name = 'AddOrderSourceToSalesOrders20260426000300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'sales_orders',
      new TableColumn({
        name: 'order_source',
        type: 'varchar',
        length: '30',
        isNullable: false,
        default: "'manual'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('sales_orders', 'order_source');
  }
}
