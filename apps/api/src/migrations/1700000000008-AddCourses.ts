import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourses1700000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "courses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "instructorId" character varying NOT NULL,
        "title" character varying NOT NULL,
        "slug" character varying NOT NULL UNIQUE,
        "description" text,
        "thumbnailUrl" character varying,
        "price" numeric(10,2) NOT NULL DEFAULT 0,
        "tags" text NOT NULL DEFAULT '',
        "published" boolean NOT NULL DEFAULT false,
        "lessonCount" integer NOT NULL DEFAULT 0,
        "enrollmentCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_courses" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lessons" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "courseId" uuid NOT NULL,
        "title" character varying NOT NULL,
        "content" text,
        "videoUrl" character varying,
        "order" integer NOT NULL DEFAULT 0,
        "durationMinutes" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lessons" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lessons_course" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "enrollments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" character varying NOT NULL,
        "courseId" uuid NOT NULL,
        "completedAt" TIMESTAMP,
        "enrolledAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_enrollments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_enrollments_user_course" UNIQUE ("userId", "courseId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lesson_progress" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" character varying NOT NULL,
        "lessonId" uuid NOT NULL,
        "courseId" uuid NOT NULL,
        "completedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lesson_progress" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_lesson_progress_user_lesson" UNIQUE ("userId", "lessonId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "certificates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" character varying NOT NULL,
        "courseId" uuid NOT NULL,
        "certificateNumber" character varying NOT NULL UNIQUE,
        "issuedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_certificates" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_certificates_user_course" UNIQUE ("userId", "courseId")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_courses_published" ON "courses" ("published")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_courses_instructorId" ON "courses" ("instructorId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_enrollments_userId" ON "enrollments" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_lesson_progress_userId_courseId" ON "lesson_progress" ("userId", "courseId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "certificates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lesson_progress"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "enrollments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lessons"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "courses"`);
  }
}
