import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripeCustomerId1700000000001 implements MigrationInterface {
  name = 'AddStripeCustomerId1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeCustomerId" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "stripeCustomerId"`);
  }
}
