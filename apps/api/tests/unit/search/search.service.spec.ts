import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SearchService } from '../../../src/search/search.service';
import { ProfileEntity } from '../../../src/profiles/entities/profile.entity';
import { ListingEntity } from '../../../src/listings/entities/listing.entity';
import { EventEntity } from '../../../src/events/entities/event.entity';

const mockRepo = () => ({ find: jest.fn() });

describe('SearchService', () => {
  let service: SearchService;
  let profileRepo: ReturnType<typeof mockRepo>;
  let listingRepo: ReturnType<typeof mockRepo>;
  let eventRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: getRepositoryToken(ProfileEntity), useFactory: mockRepo },
        { provide: getRepositoryToken(ListingEntity), useFactory: mockRepo },
        { provide: getRepositoryToken(EventEntity), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    profileRepo = module.get(getRepositoryToken(ProfileEntity));
    listingRepo = module.get(getRepositoryToken(ListingEntity));
    eventRepo = module.get(getRepositoryToken(EventEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('search — no type filter', () => {
    it('queries all three repos and returns combined results', async () => {
      profileRepo.find.mockResolvedValue([{ id: 'p-1' }]);
      listingRepo.find.mockResolvedValue([{ id: 'l-1' }]);
      eventRepo.find.mockResolvedValue([{ id: 'e-1' }]);

      const result = await service.search('honda');
      expect(result).toEqual({
        profiles: [{ id: 'p-1' }],
        listings: [{ id: 'l-1' }],
        events: [{ id: 'e-1' }],
      });
    });

    it('returns empty arrays when no matches are found', async () => {
      profileRepo.find.mockResolvedValue([]);
      listingRepo.find.mockResolvedValue([]);
      eventRepo.find.mockResolvedValue([]);

      const result = await service.search('xyznotfound');
      expect(result.profiles).toEqual([]);
      expect(result.listings).toEqual([]);
      expect(result.events).toEqual([]);
    });
  });

  describe('search — profiles only', () => {
    it('queries only profileRepo and omits listings/events keys', async () => {
      profileRepo.find.mockResolvedValue([{ id: 'p-1' }]);

      const result = await service.search('mechanic', 'profiles');

      expect(result.profiles).toEqual([{ id: 'p-1' }]);
      expect(result.listings).toBeUndefined();
      expect(result.events).toBeUndefined();
      expect(listingRepo.find).not.toHaveBeenCalled();
      expect(eventRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('search — listings only', () => {
    it('queries only listingRepo and omits profiles/events keys', async () => {
      listingRepo.find.mockResolvedValue([{ id: 'l-1' }]);

      const result = await service.search('exhaust', 'listings');

      expect(result.listings).toEqual([{ id: 'l-1' }]);
      expect(result.profiles).toBeUndefined();
      expect(result.events).toBeUndefined();
      expect(profileRepo.find).not.toHaveBeenCalled();
      expect(eventRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('search — events only', () => {
    it('queries only eventRepo and omits profiles/listings keys', async () => {
      eventRepo.find.mockResolvedValue([{ id: 'e-1' }]);

      const result = await service.search('sema', 'events');

      expect(result.events).toEqual([{ id: 'e-1' }]);
      expect(result.profiles).toBeUndefined();
      expect(result.listings).toBeUndefined();
      expect(profileRepo.find).not.toHaveBeenCalled();
      expect(listingRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('search — location filter', () => {
    it('filters profiles by location substring', async () => {
      const profiles = [
        { id: 'p-1', location: 'Los Angeles, CA', tags: [] },
        { id: 'p-2', location: 'Dallas, TX', tags: [] },
      ];
      profileRepo.find.mockResolvedValue(profiles);
      listingRepo.find.mockResolvedValue([]);
      eventRepo.find.mockResolvedValue([]);

      const result = await service.search('mechanic', undefined, 'Dallas');

      expect(result.profiles).toEqual([{ id: 'p-2', location: 'Dallas, TX', tags: [] }]);
    });

    it('filters listings by location substring', async () => {
      const listings = [
        { id: 'l-1', location: 'Miami, FL' },
        { id: 'l-2', location: 'Seattle, WA' },
      ];
      listingRepo.find.mockResolvedValue(listings);
      profileRepo.find.mockResolvedValue([]);
      eventRepo.find.mockResolvedValue([]);

      const result = await service.search('car', undefined, 'Miami');

      expect(result.listings).toEqual([{ id: 'l-1', location: 'Miami, FL' }]);
    });

    it('returns all when location filter does not match anything', async () => {
      profileRepo.find.mockResolvedValue([{ id: 'p-1', location: 'Austin, TX', tags: [] }]);
      listingRepo.find.mockResolvedValue([]);
      eventRepo.find.mockResolvedValue([]);

      const result = await service.search('car', undefined, 'NewYork');

      expect(result.profiles).toEqual([]);
    });
  });

  describe('search — tag filter', () => {
    it('filters profiles by tag substring (case-insensitive)', async () => {
      const profiles = [
        { id: 'p-1', location: 'LA', tags: ['Classic Cars', 'Performance'] },
        { id: 'p-2', location: 'TX', tags: ['Diesel'] },
      ];
      profileRepo.find.mockResolvedValue(profiles);
      listingRepo.find.mockResolvedValue([]);
      eventRepo.find.mockResolvedValue([]);

      const result = await service.search('shop', undefined, undefined, 'classic');

      expect(result.profiles).toEqual([profiles[0]]);
    });

    it('returns empty profiles when no tag matches', async () => {
      profileRepo.find.mockResolvedValue([{ id: 'p-1', location: 'LA', tags: ['Diesel'] }]);
      listingRepo.find.mockResolvedValue([]);
      eventRepo.find.mockResolvedValue([]);

      const result = await service.search('shop', undefined, undefined, 'EV');

      expect(result.profiles).toEqual([]);
    });
  });

  describe('search — combined location + tag filters', () => {
    it('applies both filters independently', async () => {
      const profiles = [
        { id: 'p-1', location: 'Los Angeles, CA', tags: ['Classic Cars'] },
        { id: 'p-2', location: 'Los Angeles, CA', tags: ['Diesel'] },
        { id: 'p-3', location: 'Dallas, TX', tags: ['Classic Cars'] },
      ];
      profileRepo.find.mockResolvedValue(profiles);
      listingRepo.find.mockResolvedValue([]);
      eventRepo.find.mockResolvedValue([]);

      const result = await service.search('m', undefined, 'Los Angeles', 'Classic');

      expect(result.profiles).toEqual([profiles[0]]);
    });
  });
});
