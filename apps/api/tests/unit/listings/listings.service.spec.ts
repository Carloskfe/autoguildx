import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ListingsService } from '../../../src/listings/listings.service';
import { ListingEntity } from '../../../src/listings/entities/listing.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('ListingsService', () => {
  let service: ListingsService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: getRepositoryToken(ListingEntity), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
    repo = module.get(getRepositoryToken(ListingEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('saves and returns the new listing', async () => {
      const listing = { id: 'l-1', userId: 'u-1', title: 'Exhaust Kit' };
      repo.create.mockReturnValue(listing);
      repo.save.mockResolvedValue(listing);

      const result = await service.create('u-1', { title: 'Exhaust Kit' });
      expect(result).toEqual(listing);
      expect(repo.create).toHaveBeenCalledWith({ title: 'Exhaust Kit', userId: 'u-1' });
    });
  });

  describe('findAll', () => {
    it('returns active listings with default pagination', async () => {
      repo.find.mockResolvedValue([]);
      await service.findAll({});
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
          skip: 0,
          take: 20,
        }),
      );
    });

    it('applies type and category filters', async () => {
      repo.find.mockResolvedValue([]);
      await service.findAll({ type: 'part', category: 'engine' });
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'part', category: 'engine' }),
        }),
      );
    });

    it('applies correct page offset', async () => {
      repo.find.mockResolvedValue([]);
      await service.findAll({ page: 3, limit: 10 });
      expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 10 }));
    });

    it('orders by isFeatured desc then createdAt desc', async () => {
      repo.find.mockResolvedValue([]);
      await service.findAll({});
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ order: { isFeatured: 'DESC', createdAt: 'DESC' } }),
      );
    });
  });

  describe('findById', () => {
    it('returns listing when found', async () => {
      const listing = { id: 'l-1' };
      repo.findOne.mockResolvedValue(listing);
      const result = await service.findById('l-1');
      expect(result).toEqual(listing);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('applies patches and saves when user owns listing', async () => {
      const listing = { id: 'l-1', userId: 'u-1', title: 'Old Title' };
      repo.findOne.mockResolvedValue(listing);
      repo.save.mockImplementation((l) => Promise.resolve(l));

      const result = await service.update('l-1', 'u-1', { title: 'New Title' } as any);
      expect(result.title).toBe('New Title');
    });

    it('throws NotFoundException when listing does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.update('bad-id', 'u-1', {})).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user does not own listing', async () => {
      repo.findOne.mockResolvedValue({ id: 'l-1', userId: 'u-2' });
      await expect(service.update('l-1', 'u-1', {})).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('removes listing when user owns it', async () => {
      const listing = { id: 'l-1', userId: 'u-1' };
      repo.findOne.mockResolvedValue(listing);
      repo.remove.mockResolvedValue(undefined);

      const result = await service.delete('l-1', 'u-1');
      expect(result).toEqual({ deleted: true });
      expect(repo.remove).toHaveBeenCalledWith(listing);
    });

    it('throws NotFoundException when listing does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.delete('bad-id', 'u-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user does not own listing', async () => {
      repo.findOne.mockResolvedValue({ id: 'l-1', userId: 'u-2' });
      await expect(service.delete('l-1', 'u-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('featureListing', () => {
    it('sets isFeatured to true and calculates featuredUntil', async () => {
      const listing = { id: 'l-1', isFeatured: false, featuredUntil: null };
      repo.findOne.mockResolvedValue(listing);
      repo.save.mockImplementation((l) => Promise.resolve(l));

      const before = Date.now();
      const result = await service.featureListing('l-1', 7);
      const after = Date.now();

      expect(result.isFeatured).toBe(true);
      const until = result.featuredUntil.getTime();
      expect(until).toBeGreaterThanOrEqual(before + 7 * 86400000);
      expect(until).toBeLessThanOrEqual(after + 7 * 86400000);
    });

    it('throws NotFoundException when listing does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.featureListing('bad-id', 7)).rejects.toThrow(NotFoundException);
    });
  });
});
