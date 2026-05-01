// Requires a running PostgreSQL instance.
// Set TEST_DATABASE_URL or uses the default dev DB.
// Run: npm run test:e2e --workspace=apps/api
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5433/autoguildx';
process.env.JWT_SECRET = 'e2e-test-secret';
process.env.NODE_ENV = 'test';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';

async function clearDatabase(ds: DataSource) {
  await ds.query(`
    TRUNCATE TABLE
      "notifications", "post_reactions", "reviews",
      "messages", "conversations",
      "profile_followers", "comments", "subscriptions",
      "posts", "listings", "events", "profiles", "users"
    CASCADE
  `);
}

describe('Auth flow (E2E)', () => {
  let app: INestApplication;
  let ds: DataSource;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    ds = module.get<DataSource>(getDataSourceToken());
  });

  afterAll(async () => {
    await clearDatabase(ds);
    await app.close();
  });

  beforeEach(() => clearDatabase(ds));

  describe('POST /api/v1/auth/signup', () => {
    it('creates a user and returns accessToken + userId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({ email: 'user@example.com', password: 'Password1!', role: 'enthusiast' })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('userId');
      expect(typeof res.body.accessToken).toBe('string');
    });

    it('returns 409 when the email is already registered', async () => {
      const dto = { email: 'dup@example.com', password: 'Password1!' };
      await request(app.getHttpServer()).post('/api/v1/auth/signup').send(dto).expect(201);
      await request(app.getHttpServer()).post('/api/v1/auth/signup').send(dto).expect(409);
    });

    it('returns 400 when required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({ email: 'bad@example.com' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns a token for valid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({ email: 'login@example.com', password: 'Password1!' });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'login@example.com', password: 'Password1!' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
    });

    it('returns 401 for wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({ email: 'wrongpw@example.com', password: 'Password1!' });

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'wrongpw@example.com', password: 'WrongPass!' })
        .expect(401);
    });
  });

  describe('Full auth → onboarding → feed flow', () => {
    it('signup → create profile → read feed', async () => {
      // 1. Signup
      const signupRes = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({ email: 'flow@example.com', password: 'Password1!' })
        .expect(201);

      const { accessToken } = signupRes.body;

      // 2. Create profile (onboarding step)
      await request(app.getHttpServer())
        .post('/api/v1/profiles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Flow User', bio: 'Automotive enthusiast', roleType: 'enthusiast' })
        .expect(201);

      // 3. Read feed (public, no auth required)
      const feedRes = await request(app.getHttpServer()).get('/api/v1/feed').expect(200);

      expect(Array.isArray(feedRes.body)).toBe(true);
    });
  });
});
