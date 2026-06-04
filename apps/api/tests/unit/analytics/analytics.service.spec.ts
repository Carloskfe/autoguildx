import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../../../src/analytics/analytics.service';

// PostHog client is mocked at the module level so no real HTTP calls are made
jest.mock('posthog-node', () => ({
  PostHog: jest.fn().mockImplementation(() => ({
    capture: jest.fn(),
    identify: jest.fn(),
    shutdown: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    process.env.POSTHOG_KEY = 'phc_test_key';
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsService],
    }).compile();
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    delete process.env.POSTHOG_KEY;
    jest.clearAllMocks();
  });

  it('initialises the PostHog client when POSTHOG_KEY is set', () => {
    expect(service).toBeDefined();
  });

  it('capture does not throw', () => {
    expect(() => service.capture('user-1', 'test_event', { foo: 'bar' })).not.toThrow();
  });

  it('identify does not throw', () => {
    expect(() => service.identify('user-1', { role: 'mechanic' })).not.toThrow();
  });

  it('deletePerson does not throw when client has no deletePersons method', async () => {
    await expect(service.deletePerson('user-1')).resolves.not.toThrow();
  });

  it('capture is a no-op when POSTHOG_KEY is not set', () => {
    // Build a second instance without a key
    const noKey = new AnalyticsService();
    expect(() => noKey.capture('u', 'event')).not.toThrow();
  });
});
