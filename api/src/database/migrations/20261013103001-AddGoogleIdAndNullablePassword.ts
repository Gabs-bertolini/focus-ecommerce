import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddGoogleIdAndNullablePassword20261013103001 implements MigrationInterface {
  name = 'AddGoogleIdAndNullablePassword20261013103001';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('user'))) {
      throw new Error(
        'Cannot add Google account fields before the user table exists',
      );
    }

    if (!(await queryRunner.hasColumn('user', 'googleId'))) {
      await queryRunner.addColumn(
        'user',
        new TableColumn({
          name: 'googleId',
          type: 'character varying',
          isNullable: true,
        }),
      );
    }

    const userTable = await queryRunner.getTable('user');
    const hasGoogleIdUniqueIndex = userTable?.indices.some(
      (index) =>
        index.isUnique &&
        index.columnNames.length === 1 &&
        index.columnNames[0] === 'googleId',
    );
    if (!hasGoogleIdUniqueIndex) {
      await queryRunner.createIndex(
        'user',
        new TableIndex({
          name: 'UQ_user_googleId',
          columnNames: ['googleId'],
          isUnique: true,
        }),
      );
    }

    const passwordColumn = userTable?.findColumnByName('password');
    if (passwordColumn && !passwordColumn.isNullable) {
      const nullablePasswordColumn = passwordColumn.clone();
      nullablePasswordColumn.isNullable = true;
      await queryRunner.changeColumn(
        'user',
        passwordColumn,
        nullablePasswordColumn,
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('user'))) {
      return;
    }

    const userTable = await queryRunner.getTable('user');
    const passwordColumn = userTable?.findColumnByName('password');
    if (passwordColumn?.isNullable) {
      const [{ count }] = await queryRunner.query(
        `SELECT COUNT(*)::int AS count FROM "user" WHERE "password" IS NULL`,
      );
      if (Number(count) > 0) {
        throw new Error(
          'Cannot revert nullable passwords while Google-only accounts exist',
        );
      }
      const notNullPasswordColumn = passwordColumn.clone();
      notNullPasswordColumn.isNullable = false;
      await queryRunner.changeColumn(
        'user',
        passwordColumn,
        notNullPasswordColumn,
      );
    }

    const googleIdIndex = userTable?.indices.find(
      (index) =>
        index.isUnique &&
        index.columnNames.length === 1 &&
        index.columnNames[0] === 'googleId',
    );
    if (googleIdIndex) {
      await queryRunner.dropIndex('user', googleIdIndex);
    }

    if (await queryRunner.hasColumn('user', 'googleId')) {
      await queryRunner.dropColumn('user', 'googleId');
    }
  }
}
