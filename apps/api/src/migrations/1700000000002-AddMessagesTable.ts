import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessagesTable1700000000002 implements MigrationInterface {
  name = 'AddMessagesTable1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "participantAId" character varying NOT NULL,
        "participantBId" character varying NOT NULL,
        "lastMessageAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_conversations_participants" UNIQUE ("participantAId", "participantBId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "conversationId" character varying NOT NULL,
        "senderId" character varying NOT NULL,
        "content" text NOT NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_messages_conversationId" ON "messages" ("conversationId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_messages_isRead" ON "messages" ("conversationId", "isRead")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "conversations"`);
  }
}
