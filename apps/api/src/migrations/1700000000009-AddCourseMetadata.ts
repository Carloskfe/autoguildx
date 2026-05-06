import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourseMetadata1700000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "level" character varying NOT NULL DEFAULT 'All Levels'`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "objectives" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "requirements" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "section" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN IF EXISTS "section"`);
    await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN IF EXISTS "requirements"`);
    await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN IF EXISTS "objectives"`);
    await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN IF EXISTS "level"`);
  }
}
