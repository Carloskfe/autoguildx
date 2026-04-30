import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReactionsVisibilityShareReviews1700000000003 implements MigrationInterface {
  name = 'AddReactionsVisibilityShareReviews1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Post visibility, sharing
    await queryRunner.query(
      `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "visibility" character varying NOT NULL DEFAULT 'public'`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "sharesCount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "sharedPostId" uuid`);

    // Reactions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "post_reactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "postId" character varying NOT NULL,
        "userId" character varying NOT NULL,
        "emoji" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_post_reactions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_post_reactions_post_user" UNIQUE ("postId", "userId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_post_reactions_postId" ON "post_reactions" ("postId")`,
    );

    // Reviews
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "reviewerId" character varying NOT NULL,
        "targetId" character varying NOT NULL,
        "targetType" character varying NOT NULL,
        "rating" integer NOT NULL,
        "qualityRating" integer,
        "communicationRating" integer,
        "timelinessRating" integer,
        "valueRating" integer,
        "comment" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_reviews_reviewer_target" UNIQUE ("reviewerId", "targetId", "targetType")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reviews_target" ON "reviews" ("targetId", "targetType")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "post_reactions"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "sharedPostId"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "sharesCount"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "visibility"`);
  }
}
