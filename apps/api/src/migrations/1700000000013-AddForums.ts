import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddForums1700000000013 implements MigrationInterface {
  name = 'AddForums1700000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Extend comments table for threading + forum support ─────────────────
    await queryRunner.query(
      `ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "parentId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "forumPostId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "voteScore" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments"
       ADD CONSTRAINT "FK_comments_parent"
       FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE`,
    );

    // ── forums ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "forums" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "description" text NOT NULL,
        "category" character varying NOT NULL,
        "rules" text,
        "createdByUserId" uuid NOT NULL,
        "memberCount" integer NOT NULL DEFAULT 0,
        "postCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_forums" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_forums_slug" UNIQUE ("slug")
      )
    `);

    // ── forum_posts ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "forum_posts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "forumId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "title" character varying NOT NULL,
        "content" text NOT NULL,
        "mediaUrls" text NOT NULL DEFAULT '',
        "voteScore" integer NOT NULL DEFAULT 0,
        "commentCount" integer NOT NULL DEFAULT 0,
        "isPinned" boolean NOT NULL DEFAULT false,
        "isLocked" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_forum_posts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_forum_posts_forum"
          FOREIGN KEY ("forumId") REFERENCES "forums"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_forum_posts_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_forum_posts_forumId" ON "forum_posts" ("forumId")`,
    );

    // ── forum_members ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "forum_members" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "forumId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "joinedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_forum_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_forum_members_forum_user" UNIQUE ("forumId", "userId"),
        CONSTRAINT "FK_forum_members_forum"
          FOREIGN KEY ("forumId") REFERENCES "forums"("id") ON DELETE CASCADE
      )
    `);

    // ── forum_votes ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "forum_votes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "forumPostId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "value" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_forum_votes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_forum_votes_post_user" UNIQUE ("forumPostId", "userId"),
        CONSTRAINT "FK_forum_votes_post"
          FOREIGN KEY ("forumPostId") REFERENCES "forum_posts"("id") ON DELETE CASCADE
      )
    `);

    // ── forum_comment_votes ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "forum_comment_votes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "commentId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "value" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_forum_comment_votes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_forum_comment_votes_comment_user" UNIQUE ("commentId", "userId"),
        CONSTRAINT "FK_forum_comment_votes_comment"
          FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "forum_comment_votes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "forum_votes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "forum_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "forum_posts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "forums"`);
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "FK_comments_parent"`,
    );
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "voteScore"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "forumPostId"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "parentId"`);
  }
}
