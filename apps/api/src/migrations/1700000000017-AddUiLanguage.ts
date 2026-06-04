import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUiLanguage1700000000017 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "uiLanguage" VARCHAR(5) NOT NULL DEFAULT 'en'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "uiLanguage"`);
  }
}
