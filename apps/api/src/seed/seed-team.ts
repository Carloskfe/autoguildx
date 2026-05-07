/**
 * Idempotent seed script — creates the AutoGuildX team account.
 *
 * Run with:
 *   npm run seed:team --workspace=apps/api
 *
 * Requires DATABASE_URL in environment (or .env at apps/api root).
 */

import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { UserEntity } from '../auth/entities/user.entity';
import { ProfileEntity } from '../profiles/entities/profile.entity';

const TEAM_EMAIL = 'team@autoguildx.com';
const TEAM_PASSWORD = process.env.TEAM_SEED_PASSWORD ?? 'ChangeMe!2026';

async function seed() {
  await AppDataSource.initialize();
  console.log('Connected to database.');

  const userRepo = AppDataSource.getRepository(UserEntity);
  const profileRepo = AppDataSource.getRepository(ProfileEntity);

  // ── User ──────────────────────────────────────────────────────────────────────
  let user = await userRepo.findOne({ where: { email: TEAM_EMAIL } });

  if (!user) {
    const passwordHash = await bcrypt.hash(TEAM_PASSWORD, 12);
    user = userRepo.create({
      email: TEAM_EMAIL,
      passwordHash,
      role: 'admin',
      provider: 'email',
      emailVerified: true,
      isTeamAccount: true,
    });
    await userRepo.save(user);
    console.log(`Created team user: ${user.id}`);
  } else {
    // Ensure flags are correct even if user was pre-existing
    await userRepo.update(user.id, {
      role: 'admin',
      emailVerified: true,
      isTeamAccount: true,
    });
    console.log(`Team user already exists: ${user.id} — flags updated.`);
  }

  // ── Profile ───────────────────────────────────────────────────────────────────
  let profile = await profileRepo.findOne({ where: { userId: user.id } });

  if (!profile) {
    profile = profileRepo.create({
      userId: user.id,
      name: 'AutoGuildX',
      bio: 'The professional network and marketplace for automotive experts — mechanics, manufacturers, collectors, and enthusiasts.',
      location: 'Worldwide',
      role: 'manufacturer',
      tags: ['Engine', 'Performance', 'Restoration', 'Fabrication', 'Tuning & Performance'],
      isVerified: true,
    });
    await profileRepo.save(profile);
    console.log(`Created team profile: ${profile.id}`);
  } else {
    await profileRepo.update(profile.id, { isVerified: true });
    console.log(`Team profile already exists: ${profile.id} — isVerified ensured.`);
  }

  console.log('\n✅ Team seed complete.');
  console.log(`   User ID:    ${user.id}`);
  console.log(`   Profile ID: ${profile.id}`);
  console.log(`   Profile URL: /profile/${user.id}`);
  console.log('\n⚠️  Change the team account password via /settings after first login.');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
