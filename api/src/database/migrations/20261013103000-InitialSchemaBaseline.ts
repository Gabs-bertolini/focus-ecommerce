import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableUnique,
} from 'typeorm';

export class InitialSchemaBaseline20261013103000 implements MigrationInterface {
  name = 'InitialSchemaBaseline20261013103000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('user'))) {
      await queryRunner.createTable(
        new Table({
          name: 'user',
          columns: [
            new TableColumn({
              name: 'id',
              type: 'integer',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            }),
            new TableColumn({ name: 'email', type: 'character varying' }),
            new TableColumn({ name: 'password', type: 'character varying' }),
            new TableColumn({
              name: 'isAdmin',
              type: 'boolean',
              default: false,
            }),
          ],
          uniques: [
            new TableUnique({
              name: 'UQ_user_email',
              columnNames: ['email'],
            }),
          ],
        }),
      );
    }

    if (!(await queryRunner.hasTable('product'))) {
      await queryRunner.createTable(
        new Table({
          name: 'product',
          columns: [
            new TableColumn({
              name: 'id',
              type: 'integer',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            }),
            new TableColumn({ name: 'name', type: 'character varying' }),
            new TableColumn({
              name: 'price',
              type: 'numeric',
              precision: 10,
              scale: 2,
            }),
            new TableColumn({ name: 'stock', type: 'integer' }),
            new TableColumn({ name: 'image', type: 'character varying' }),
          ],
        }),
      );
    }

    if (!(await queryRunner.hasTable('stock_movement'))) {
      await queryRunner.createTable(
        new Table({
          name: 'stock_movement',
          columns: [
            new TableColumn({
              name: 'id',
              type: 'integer',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            }),
            new TableColumn({ name: 'productId', type: 'integer' }),
            new TableColumn({ name: 'productName', type: 'character varying' }),
            new TableColumn({ name: 'type', type: 'character varying' }),
            new TableColumn({ name: 'previousStock', type: 'integer' }),
            new TableColumn({ name: 'currentStock', type: 'integer' }),
            new TableColumn({
              name: 'note',
              type: 'character varying',
              isNullable: true,
            }),
            new TableColumn({
              name: 'createdAt',
              type: 'timestamp with time zone',
              default: 'now()',
            }),
          ],
        }),
      );
    }
  }

  async down(): Promise<void> {
    // This baseline also adopts databases whose tables predate migration tracking.
  }
}
