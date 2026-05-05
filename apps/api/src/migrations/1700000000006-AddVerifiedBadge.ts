import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerifiedBadge1700000000006 implements MigrationInterface {
  name = 'AddVerifiedBadge1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "isVerified" boolean NOT NULL DEFAULT false`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "verification_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" character varying NOT NULL,
        "profileId" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "note" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_verification_requests" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_verification_requests_userId" ON "verification_requests" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_verification_requests_status" ON "verification_requests" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "verification_requests"`);
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN IF EXISTS "isVerified"`);
  }
}
