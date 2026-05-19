import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostSharedContent1700000000016 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "sharedContentType" character varying`,
    );
    await runner.query(
      `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "sharedContentId" character varying`,
    );
    await runner.query(
      `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "sharedContent" text`,
    );
    await runner.query(
      `ALTER TABLE "events" ALTER COLUMN "startDate" DROP NOT NULL`,
    );
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "sharedContentType"`);
    await runner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "sharedContentId"`);
    await runner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "sharedContent"`);
  }
}
