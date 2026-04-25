process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5433/autoguildx';
process.env.JWT_SECRET = 'e2e-test-secret';
process.env.NODE_ENV = 'test';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';

async function clearDatabase(ds: DataSource) {
  await ds.query(`
    TRUNCATE TABLE
      "profile_followers", "comments", "subscriptions",
      "posts", "listings", "events", "profiles", "users"
    CASCADE
  `);
}

async function signupAndGetToken(
  server: unknown,
  email = 'seller@example.com',
): Promise<{ token: string; userId: string }> {
  const res = await request(server as Parameters<typeof request>[0])
    .post('/api/v1/auth/signup')
    .send({ email, password: 'Password1!' });
  return { token: res.body.accessToken, userId: res.body.userId };
}

const validListing = {
  type: 'part',
  title: 'OEM Brake Pads',
  description: 'Brand-new brake pads for Honda Civic 2018–2022',
  price: 49.99,
  category: 'brakes',
  vehicleTags: ['honda', 'civic'],
  location: 'Austin, TX',
};

describe('Listings flow (E2E)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let server: ReturnType<typeof app.getHttpServer>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    ds = module.get<DataSource>(getDataSourceToken());
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await clearDatabase(ds);
    await app.close();
  });

  beforeEach(() => clearDatabase(ds));

  describe('POST /api/v1/listings', () => {
    it('creates a listing and returns it', async () => {
      const { token } = await signupAndGetToken(server);

      const res = await request(server)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${token}`)
        .send(validListing)
        .expect(201);

      expect(res.body).toMatchObject({
        title: validListing.title,
        type: validListing.type,
        category: validListing.category,
        status: 'active',
        isFeatured: false,
      });
      expect(res.body).toHaveProperty('id');
    });

    it('returns 401 without a token', async () => {
      await request(server).post('/api/v1/listings').send(validListing).expect(401);
    });

    it('returns 400 when required fields are missing', async () => {
      const { token } = await signupAndGetToken(server);
      await request(server)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Incomplete' })
        .expect(400);
    });
  });

  describe('GET /api/v1/listings/:id', () => {
    it('returns the listing detail', async () => {
      const { token } = await signupAndGetToken(server);

      const createRes = await request(server)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${token}`)
        .send(validListing)
        .expect(201);

      const listingId = createRes.body.id;

      const getRes = await request(server)
        .get(`/api/v1/listings/${listingId}`)
        .expect(200);

      expect(getRes.body.id).toBe(listingId);
      expect(getRes.body.title).toBe(validListing.title);
    });

    it('returns 404 for an unknown listing', async () => {
      await request(server)
        .get('/api/v1/listings/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('Full listing creation and detail flow', () => {
    it('signup → create listing → retrieve listing → delete listing', async () => {
      const { token } = await signupAndGetToken(server);

      // Create
      const createRes = await request(server)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${token}`)
        .send(validListing)
        .expect(201);

      const listingId = createRes.body.id;

      // Retrieve
      const getRes = await request(server)
        .get(`/api/v1/listings/${listingId}`)
        .expect(200);
      expect(getRes.body.title).toBe(validListing.title);

      // Delete
      await request(server)
        .delete(`/api/v1/listings/${listingId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Confirm gone from list
      const listRes = await request(server).get('/api/v1/listings').expect(200);
      expect(listRes.body.every((l: { id: string }) => l.id !== listingId)).toBe(true);
    });
  });
});
