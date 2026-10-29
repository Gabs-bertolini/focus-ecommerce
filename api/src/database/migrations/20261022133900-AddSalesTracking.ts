import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddSalesTracking20261022133900 implements MigrationInterface {
  name = 'AddSalesTracking20261022133900';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('product', 'cost'))) {
      await queryRunner.addColumn(
        'product',
        new TableColumn({
          name: 'cost',
          type: 'numeric',
          precision: 10,
          scale: 2,
          default: 0,
        }),
      );
    }

    if (!(await queryRunner.hasTable('sales_order'))) {
      await queryRunner.createTable(
        new Table({
          name: 'sales_order',
          columns: [
            new TableColumn({
              name: 'id',
              type: 'integer',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            }),
            new TableColumn({ name: 'userId', type: 'integer' }),
            new TableColumn({
              name: 'customerEmail',
              type: 'character varying',
            }),
            new TableColumn({
              name: 'status',
              type: 'character varying',
              default: "'completed'",
            }),
            new TableColumn({
              name: 'createdAt',
              type: 'timestamp with time zone',
              default: 'now()',
            }),
          ],
        }),
      );
      await queryRunner.createIndex(
        'sales_order',
        new TableIndex({
          name: 'IDX_sales_order_createdAt',
          columnNames: ['createdAt'],
        }),
      );
    }

    if (!(await queryRunner.hasTable('sales_order_item'))) {
      await queryRunner.createTable(
        new Table({
          name: 'sales_order_item',
          columns: [
            new TableColumn({
              name: 'id',
              type: 'integer',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            }),
            new TableColumn({ name: 'saleId', type: 'integer' }),
            new TableColumn({ name: 'productId', type: 'integer' }),
            new TableColumn({ name: 'productName', type: 'character varying' }),
            new TableColumn({ name: 'quantity', type: 'integer' }),
            new TableColumn({
              name: 'unitPrice',
              type: 'numeric',
              precision: 10,
              scale: 2,
            }),
            new TableColumn({
              name: 'unitCost',
              type: 'numeric',
              precision: 10,
              scale: 2,
            }),
          ],
          foreignKeys: [
            new TableForeignKey({
              columnNames: ['saleId'],
              referencedTableName: 'sales_order',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            }),
          ],
        }),
      );
      await queryRunner.createIndex(
        'sales_order_item',
        new TableIndex({
          name: 'IDX_sales_order_item_saleId',
          columnNames: ['saleId'],
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('sales_order_item')) {
      await queryRunner.dropTable('sales_order_item');
    }
    if (await queryRunner.hasTable('sales_order')) {
      await queryRunner.dropTable('sales_order');
    }
    if (await queryRunner.hasColumn('product', 'cost')) {
      await queryRunner.dropColumn('product', 'cost');
    }
  }
}
