import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoursePreviewVideo1700000000015 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "previewVideoUrl" varchar`);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE "courses" DROP COLUMN IF EXISTS "previewVideoUrl"`);
  }
}
