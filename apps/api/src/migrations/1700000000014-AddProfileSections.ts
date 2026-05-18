import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileSections1700000000014 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "profile_sections" (
        "id"          uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "profileId"   uuid              NOT NULL,
        "type"        varchar           NOT NULL,
        "data"        jsonb             NOT NULL DEFAULT '{}',
        "sortOrder"   integer           NOT NULL DEFAULT 0,
        "createdAt"   TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_profile_sections" PRIMARY KEY ("id"),
        CONSTRAINT "FK_profile_sections_profile"
          FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE
      )
    `);
    await runner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_profile_sections_profileId" ON "profile_sections" ("profileId")`,
    );
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`DROP TABLE IF EXISTS "profile_sections"`);
  }
}
