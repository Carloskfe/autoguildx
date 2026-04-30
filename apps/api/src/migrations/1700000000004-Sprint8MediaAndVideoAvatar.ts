import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sprint8MediaAndVideoAvatar1700000000004 implements MigrationInterface {
  name = 'Sprint8MediaAndVideoAvatar1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "mediaMode" character varying NOT NULL DEFAULT 'single'`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "linkUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "linkPreviewType" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "profileVideoUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN IF EXISTS "profileVideoUrl"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "linkPreviewType"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "linkUrl"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "mediaMode"`);
  }
}
