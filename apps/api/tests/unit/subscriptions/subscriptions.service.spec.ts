import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionsService } from '../../../src/subscriptions/subscriptions.service';
import { SubscriptionEntity } from '../../../src/subscriptions/entities/subscription.entity';
import { UserEntity } from '../../../src/auth/entities/user.entity';

const mockSubRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockUserRepo = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
});

const mockStripeSession = { url: 'https://checkout.stripe.com/test' };
const mockStripeCustomer = { id: 'cus_test123' };

let mockStripeInstance: any;

jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    mockStripeInstance = {
      customers: { create: jest.fn().mockResolvedValue(mockStripeCustomer) },
      checkout: {
        sessions: { create: jest.fn().mockResolvedValue(mockStripeSession) },
      },
      webhooks: { constructEvent: jest.fn() },
    };
    return mockStripeInstance;
  }),
}));

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subRepo: ReturnType<typeof mockSubRepo>;
  let userRepo: ReturnType<typeof mockUserRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: getRepositoryToken(SubscriptionEntity), useFactory: mockSubRepo },
        { provide: getRepositoryToken(UserEntity), useFactory: mockUserRepo },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    subRepo = module.get(getRepositoryToken(SubscriptionEntity));
    userRepo = module.get(getRepositoryToken(UserEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('getCurrent', () => {
    it('returns the active subscription when one exists', async () => {
      const sub = { userId: 'u-1', tier: 'owner', active: true };
      subRepo.findOne.mockResolvedValue(sub);
      expect(await service.getCurrent('u-1')).toEqual(sub);
    });

    it('returns a free tier default when no active subscription exists', async () => {
      subRepo.findOne.mockResolvedValue(null);
      expect(await service.getCurrent('u-1')).toEqual({ tier: 'free', active: true });
    });
  });

  describe('upgrade', () => {
    it('deactivates the existing subscription and creates a new one', async () => {
      const existing = { userId: 'u-1', tier: 'owner', active: true };
      subRepo.findOne.mockResolvedValue(existing);
      const newSub = { userId: 'u-1', tier: 'company', active: true };
      subRepo.create.mockReturnValue(newSub);
      subRepo.save.mockResolvedValue(newSub);

      const result = await service.upgrade('u-1', 'company');
      expect(existing.active).toBe(false);
      expect(subRepo.save).toHaveBeenCalledWith(existing);
      expect(result).toEqual(newSub);
    });

    it('creates a new subscription when no existing active subscription is found', async () => {
      subRepo.findOne.mockResolvedValue(null);
      const newSub = { userId: 'u-1', tier: 'owner', active: true };
      subRepo.create.mockReturnValue(newSub);
      subRepo.save.mockResolvedValue(newSub);

      expect(await service.upgrade('u-1', 'owner')).toEqual(newSub);
    });
  });

  describe('cancel', () => {
    it('sets active to false and records an endDate', async () => {
      const sub = { userId: 'u-1', tier: 'owner', active: true, endDate: null };
      subRepo.findOne.mockResolvedValue(sub);
      subRepo.save.mockImplementation((s) => Promise.resolve(s));

      const result = await service.cancel('u-1');
      expect(result.active).toBe(false);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    it('throws NotFoundException when no active subscription exists', async () => {
      subRepo.findOne.mockResolvedValue(null);
      await expect(service.cancel('u-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCheckoutSession', () => {
    beforeEach(() => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_xxx';
      process.env.STRIPE_PRICE_OWNER = 'price_owner';
      process.env.STRIPE_PRICE_COMPANY = 'price_company';
    });

    afterEach(() => {
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_PRICE_OWNER;
      delete process.env.STRIPE_PRICE_COMPANY;
    });

    it('throws BadRequestException when Stripe is not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      await expect(service.createCheckoutSession('u-1', 'owner')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when price ID is not configured', async () => {
      delete process.env.STRIPE_PRICE_OWNER;
      await expect(service.createCheckoutSession('u-1', 'owner')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.createCheckoutSession('u-1', 'owner')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates a Stripe customer when the user has none and returns a checkout URL', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u-1', email: 'a@b.com', stripeCustomerId: null });
      userRepo.save.mockResolvedValue({});

      const result = await service.createCheckoutSession('u-1', 'owner');
      expect(result).toEqual({ url: mockStripeSession.url });
    });

    it('reuses an existing Stripe customer ID', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'u-1',
        email: 'a@b.com',
        stripeCustomerId: 'cus_existing',
      });

      const result = await service.createCheckoutSession('u-1', 'company');
      expect(result).toEqual({ url: mockStripeSession.url });
      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    it('returns received:true and skips verification when STRIPE_WEBHOOK_SECRET is not set', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      const result = await service.handleWebhook(Buffer.from('{}'), 'sig');
      expect(result).toEqual({ received: true });
    });

    it('throws BadRequestException on invalid signature', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
      mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(service.handleWebhook(Buffer.from('{}'), 'bad-sig')).rejects.toThrow(
        BadRequestException,
      );
      delete process.env.STRIPE_WEBHOOK_SECRET;
    });
  });
});
