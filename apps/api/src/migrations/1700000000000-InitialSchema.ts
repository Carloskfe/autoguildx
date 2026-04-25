import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "passwordHash" character varying,
        "provider" character varying NOT NULL DEFAULT 'email',
        "role" character varying NOT NULL DEFAULT 'enthusiast',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "businessName" character varying,
        "location" character varying,
        "bio" text,
        "roleType" character varying NOT NULL DEFAULT 'individual',
        "tags" text NOT NULL DEFAULT '',
        "profileImageUrl" character varying,
        "followersCount" integer NOT NULL DEFAULT 0,
        "followingCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_profiles_userId" UNIQUE ("userId"),
        CONSTRAINT "PK_profiles" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "profiles"
        ADD CONSTRAINT "FK_profiles_userId_users"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "profile_followers" (
        "followerId" uuid NOT NULL,
        "followingId" uuid NOT NULL,
        CONSTRAINT "PK_profile_followers" PRIMARY KEY ("followerId", "followingId")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_profile_followers_followerId" ON "profile_followers" ("followerId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_profile_followers_followingId" ON "profile_followers" ("followingId")`,
    );

    await queryRunner.query(`
      ALTER TABLE "profile_followers"
        ADD CONSTRAINT "FK_profile_followers_followerId"
        FOREIGN KEY ("followerId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "profile_followers"
        ADD CONSTRAINT "FK_profile_followers_followingId"
        FOREIGN KEY ("followingId") REFERENCES "profiles"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "posts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "content" text NOT NULL,
        "mediaUrls" text NOT NULL DEFAULT '',
        "likesCount" integer NOT NULL DEFAULT 0,
        "commentsCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_posts" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "posts"
        ADD CONSTRAINT "FK_posts_userId_users"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "postId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "content" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "comments"
        ADD CONSTRAINT "FK_comments_postId_posts"
        FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "comments"
        ADD CONSTRAINT "FK_comments_userId_users"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "listings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "type" character varying NOT NULL,
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "price" numeric,
        "category" character varying NOT NULL,
        "vehicleTags" text NOT NULL DEFAULT '',
        "location" character varying,
        "mediaUrls" text NOT NULL DEFAULT '',
        "status" character varying NOT NULL DEFAULT 'active',
        "isFeatured" boolean NOT NULL DEFAULT false,
        "featuredUntil" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_listings" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "listings"
        ADD CONSTRAINT "FK_listings_userId_users"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organizerId" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "type" character varying NOT NULL DEFAULT 'other',
        "location" character varying NOT NULL,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP,
        "mediaUrls" text NOT NULL DEFAULT '',
        "rsvpCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_events" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
        ADD CONSTRAINT "FK_events_organizerId_users"
        FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "tier" character varying NOT NULL DEFAULT 'free',
        "active" boolean NOT NULL DEFAULT true,
        "startDate" TIMESTAMP NOT NULL DEFAULT now(),
        "endDate" TIMESTAMP,
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions"
        ADD CONSTRAINT "FK_subscriptions_userId_users"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_userId_users"`,
    );
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_events_organizerId_users"`);
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP CONSTRAINT "FK_listings_userId_users"`);
    await queryRunner.query(`DROP TABLE "listings"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_userId_users"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_postId_posts"`);
    await queryRunner.query(`DROP TABLE "comments"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_userId_users"`);
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(
      `ALTER TABLE "profile_followers" DROP CONSTRAINT "FK_profile_followers_followingId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_followers" DROP CONSTRAINT "FK_profile_followers_followerId"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_profile_followers_followingId"`);
    await queryRunner.query(`DROP INDEX "IDX_profile_followers_followerId"`);
    await queryRunner.query(`DROP TABLE "profile_followers"`);
    await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "FK_profiles_userId_users"`);
    await queryRunner.query(`DROP TABLE "profiles"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
