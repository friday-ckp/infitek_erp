import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AlignLogisticsOrdersForStory712026050200100
  implements MigrationInterface
{
  name = 'AlignLogisticsOrdersForStory712026050200100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('logistics_orders', [
      new TableColumn({
        name: 'shipping_mark',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'etd',
        type: 'date',
        isNullable: true,
      }),
      new TableColumn({
        name: 'eta',
        type: 'date',
        isNullable: true,
      }),
      new TableColumn({
        name: 'booking_number',
        type: 'varchar',
        length: '120',
        isNullable: true,
      }),
      new TableColumn({
        name: 'carrier',
        type: 'varchar',
        length: '200',
        isNullable: true,
      }),
      new TableColumn({
        name: 'vessel_voyage',
        type: 'varchar',
        length: '200',
        isNullable: true,
      }),
      new TableColumn({
        name: 'bl_so_number',
        type: 'varchar',
        length: '120',
        isNullable: true,
      }),
      new TableColumn({
        name: 'actual_departure_date',
        type: 'date',
        isNullable: true,
      }),
    ]);

    await queryRunner.addColumns('logistics_order_packages', [
      new TableColumn({
        name: 'logistics_order_item_id',
        type: 'bigint',
        unsigned: true,
        isNullable: true,
      }),
      new TableColumn({
        name: 'shipping_demand_item_id',
        type: 'bigint',
        unsigned: true,
        isNullable: true,
      }),
      new TableColumn({
        name: 'sku_id',
        type: 'bigint',
        unsigned: true,
        isNullable: true,
      }),
      new TableColumn({
        name: 'sku_code',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    ]);

    await queryRunner.createIndices('logistics_order_packages', [
      new TableIndex({
        name: 'idx_logistics_order_packages_item_id',
        columnNames: ['logistics_order_item_id'],
      }),
      new TableIndex({
        name: 'idx_logistics_order_packages_demand_item_id',
        columnNames: ['shipping_demand_item_id'],
      }),
      new TableIndex({
        name: 'idx_logistics_order_packages_sku_id',
        columnNames: ['sku_id'],
      }),
    ]);

    await queryRunner.createForeignKeys('logistics_order_packages', [
      new TableForeignKey({
        name: 'fk_logistics_order_packages_item_id',
        columnNames: ['logistics_order_item_id'],
        referencedTableName: 'logistics_order_items',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        name: 'fk_logistics_order_packages_demand_item_id',
        columnNames: ['shipping_demand_item_id'],
        referencedTableName: 'shipping_demand_items',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        name: 'fk_logistics_order_packages_sku_id',
        columnNames: ['sku_id'],
        referencedTableName: 'skus',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const packagesTable = await queryRunner.getTable('logistics_order_packages');
    if (packagesTable) {
      for (const foreignKeyName of [
        'fk_logistics_order_packages_item_id',
        'fk_logistics_order_packages_demand_item_id',
        'fk_logistics_order_packages_sku_id',
      ]) {
        const foreignKey = packagesTable.foreignKeys.find(
          (item) => item.name === foreignKeyName,
        );
        if (foreignKey) {
          await queryRunner.dropForeignKey('logistics_order_packages', foreignKey);
        }
      }
    }

    for (const indexName of [
      'idx_logistics_order_packages_item_id',
      'idx_logistics_order_packages_demand_item_id',
      'idx_logistics_order_packages_sku_id',
    ]) {
      await queryRunner.dropIndex('logistics_order_packages', indexName);
    }

    await queryRunner.dropColumns('logistics_order_packages', [
      'logistics_order_item_id',
      'shipping_demand_item_id',
      'sku_id',
      'sku_code',
    ]);

    await queryRunner.dropColumns('logistics_orders', [
      'shipping_mark',
      'etd',
      'eta',
      'booking_number',
      'carrier',
      'vessel_voyage',
      'bl_so_number',
      'actual_departure_date',
    ]);
  }
}
