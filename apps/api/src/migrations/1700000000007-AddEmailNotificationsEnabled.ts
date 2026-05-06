import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailNotificationsEnabled1700000000007 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailNotificationsEnabled" boolean NOT NULL DEFAULT true`,
    );
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "emailNotificationsEnabled"`);
  }
}
