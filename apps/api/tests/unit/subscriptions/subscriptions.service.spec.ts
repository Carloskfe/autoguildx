import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SubscriptionsService } from '../../../src/subscriptions/subscriptions.service';
import { SubscriptionEntity } from '../../../src/subscriptions/entities/subscription.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: getRepositoryToken(SubscriptionEntity), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    repo = module.get(getRepositoryToken(SubscriptionEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('getCurrent', () => {
    it('returns the active subscription when one exists', async () => {
      const sub = { userId: 'u-1', tier: 'owner', active: true };
      repo.findOne.mockResolvedValue(sub);

      const result = await service.getCurrent('u-1');
      expect(result).toEqual(sub);
    });

    it('returns a free tier default when no active subscription exists', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.getCurrent('u-1');
      expect(result).toEqual({ tier: 'free', active: true });
    });
  });

  describe('upgrade', () => {
    it('deactivates the existing subscription and creates a new one', async () => {
      const existing = { userId: 'u-1', tier: 'owner', active: true };
      repo.findOne.mockResolvedValue(existing);
      const newSub = { userId: 'u-1', tier: 'company', active: true };
      repo.create.mockReturnValue(newSub);
      repo.save.mockResolvedValue(newSub);

      const result = await service.upgrade('u-1', 'company');

      expect(existing.active).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(existing);
      expect(result).toEqual(newSub);
    });

    it('creates a new subscription when no existing active subscription is found', async () => {
      repo.findOne.mockResolvedValue(null);
      const newSub = { userId: 'u-1', tier: 'owner', active: true };
      repo.create.mockReturnValue(newSub);
      repo.save.mockResolvedValue(newSub);

      const result = await service.upgrade('u-1', 'owner');
      expect(result).toEqual(newSub);
    });
  });

  describe('cancel', () => {
    it('sets active to false and records an endDate', async () => {
      const sub = { userId: 'u-1', tier: 'owner', active: true, endDate: null };
      repo.findOne.mockResolvedValue(sub);
      repo.save.mockImplementation((s) => Promise.resolve(s));

      const result = await service.cancel('u-1');
      expect(result.active).toBe(false);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    it('throws NotFoundException when no active subscription exists', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.cancel('u-1')).rejects.toThrow(NotFoundException);
    });
  });
});
