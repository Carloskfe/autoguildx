import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { ReviewsService } from '../../../src/reviews/reviews.service';
import { ReviewEntity } from '../../../src/reviews/entities/review.entity';
import { NotificationsService } from '../../../src/notifications/notifications.service';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

const review = (overrides = {}): Partial<ReviewEntity> => ({
  id: 'rev-1',
  reviewerId: 'u-reviewer',
  targetId: 'u-target',
  targetType: 'profile',
  rating: 5,
  comment: 'Great work',
  createdAt: new Date(),
  ...overrides,
});

describe('ReviewsService', () => {
  let service: ReviewsService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(ReviewEntity), useFactory: mockRepo },
        { provide: NotificationsService, useValue: { create: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    repo = module.get(getRepositoryToken(ReviewEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('upsert', () => {
    const dto = { targetId: 'u-target', targetType: 'profile' as const, rating: 5, comment: 'Great' };

    it('throws ForbiddenException when reviewing yourself', async () => {
      await expect(service.upsert('u-target', dto)).rejects.toThrow(ForbiddenException);
    });

    it('creates a new review when none exists', async () => {
      repo.findOne.mockResolvedValue(null);
      const r = review();
      repo.create.mockReturnValue(r);
      repo.save.mockResolvedValue(r);
      const result = await service.upsert('u-reviewer', dto);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ reviewerId: 'u-reviewer' }));
      expect(result).toBe(r);
    });

    it('updates an existing review on re-submit', async () => {
      const existing = review() as ReviewEntity;
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockResolvedValue({ ...existing, rating: 4 });
      const result = await service.upsert('u-reviewer', { ...dto, rating: 4 });
      expect(result.rating).toBe(4);
    });
  });

  describe('getForTarget', () => {
    it('returns reviews with average and distribution', async () => {
      const reviews = [review({ rating: 5 }), review({ id: 'rev-2', rating: 3 })];
      repo.findAndCount.mockResolvedValue([reviews, 2]);
      const result = await service.getForTarget('u-target', 'profile');
      expect(result.total).toBe(2);
      expect(result.avgRating).toBe(4);
      expect(result.distribution[5]).toBe(1);
      expect(result.distribution[3]).toBe(1);
    });

    it('returns null avgRating when no reviews exist', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);
      const result = await service.getForTarget('listing-1', 'listing');
      expect(result.avgRating).toBeNull();
    });
  });

  describe('getSummary', () => {
    it('returns correct average and total', async () => {
      repo.find.mockResolvedValue([{ rating: 4 }, { rating: 5 }]);
      const result = await service.getSummary('u-target', 'profile');
      expect(result.avgRating).toBe(4.5);
      expect(result.total).toBe(2);
    });

    it('returns null avgRating when no reviews', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.getSummary('u-target', 'profile');
      expect(result.avgRating).toBeNull();
    });
  });

  describe('deleteReview', () => {
    it('deletes when reviewer matches', async () => {
      const r = review() as ReviewEntity;
      repo.findOne.mockResolvedValue(r);
      repo.remove.mockResolvedValue(r);
      expect(await service.deleteReview('rev-1', 'u-reviewer')).toEqual({ deleted: true });
    });

    it('throws ForbiddenException when reviewer does not match', async () => {
      repo.findOne.mockResolvedValue(review() as ReviewEntity);
      await expect(service.deleteReview('rev-1', 'u-other')).rejects.toThrow(ForbiddenException);
    });

    it('returns deleted:false when review not found', async () => {
      repo.findOne.mockResolvedValue(null);
      expect(await service.deleteReview('rev-x', 'u-1')).toEqual({ deleted: false });
    });
  });
});
