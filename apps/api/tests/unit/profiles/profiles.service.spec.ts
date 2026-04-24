import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProfilesService } from '../../../src/profiles/profiles.service';
import { ProfileEntity } from '../../../src/profiles/entities/profile.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const makeProfile = (overrides: Partial<ProfileEntity> = {}) =>
  ({
    id: 'p-1',
    userId: 'u-1',
    name: 'Test User',
    following: [],
    followingCount: 0,
    followersCount: 0,
    ...overrides,
  }) as unknown as ProfileEntity;

describe('ProfilesService', () => {
  let service: ProfilesService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        { provide: getRepositoryToken(ProfileEntity), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    repo = module.get(getRepositoryToken(ProfileEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates and returns a profile', async () => {
      repo.findOne.mockResolvedValue(null);
      const p = makeProfile();
      repo.create.mockReturnValue(p);
      repo.save.mockResolvedValue(p);

      const result = await service.create('u-1', { name: 'Test User' });
      expect(result).toEqual(p);
    });

    it('throws ConflictException if profile already exists for the user', async () => {
      repo.findOne.mockResolvedValue(makeProfile());
      await expect(service.create('u-1', {})).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('returns the profile when found', async () => {
      const p = makeProfile();
      repo.findOne.mockResolvedValue(p);
      const result = await service.findById('p-1');
      expect(result).toEqual(p);
    });

    it('throws NotFoundException when profile does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUserId', () => {
    it('returns profile for a given userId', async () => {
      const p = makeProfile();
      repo.findOne.mockResolvedValue(p);
      const result = await service.findByUserId('u-1');
      expect(result).toEqual(p);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findByUserId('u-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('applies patches and saves', async () => {
      const p = makeProfile();
      repo.findOne.mockResolvedValue(p);
      repo.save.mockImplementation((profile) => Promise.resolve(profile));

      const result = await service.update('u-1', { name: 'Updated' } as any);
      expect(result.name).toBe('Updated');
    });
  });

  describe('follow', () => {
    it('adds target to following list and increments both counters', async () => {
      const follower = makeProfile({ id: 'p-1', userId: 'u-1', following: [], followingCount: 0 });
      const target = makeProfile({ id: 'p-2', userId: 'u-2', followersCount: 0 });

      repo.findOne.mockResolvedValueOnce(follower).mockResolvedValueOnce(target);
      repo.save.mockResolvedValue({});

      const result = await service.follow('u-1', 'p-2');
      expect(result).toEqual({ followed: true });
      expect(follower.followingCount).toBe(1);
      expect(target.followersCount).toBe(1);
    });

    it('does not duplicate follow if already following', async () => {
      const target = makeProfile({ id: 'p-2', userId: 'u-2' });
      const follower = makeProfile({ id: 'p-1', userId: 'u-1', following: [target], followingCount: 1 });

      repo.findOne.mockResolvedValueOnce(follower).mockResolvedValueOnce(target);

      await service.follow('u-1', 'p-2');
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException if either profile is missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.follow('u-1', 'p-2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('unfollow', () => {
    it('removes target from following and decrements both counters', async () => {
      const target = makeProfile({ id: 'p-2', userId: 'u-2', followersCount: 1 });
      const follower = makeProfile({
        id: 'p-1',
        userId: 'u-1',
        following: [target],
        followingCount: 1,
      });

      repo.findOne.mockResolvedValueOnce(follower).mockResolvedValueOnce(target);
      repo.save.mockResolvedValue({});

      const result = await service.unfollow('u-1', 'p-2');
      expect(result).toEqual({ unfollowed: true });
      expect(follower.followingCount).toBe(0);
      expect(target.followersCount).toBe(0);
    });

    it('does not go below zero on counters', async () => {
      const target = makeProfile({ id: 'p-2', userId: 'u-2', followersCount: 0 });
      const follower = makeProfile({ id: 'p-1', userId: 'u-1', following: [], followingCount: 0 });

      repo.findOne.mockResolvedValueOnce(follower).mockResolvedValueOnce(target);
      repo.save.mockResolvedValue({});

      await service.unfollow('u-1', 'p-2');
      expect(follower.followingCount).toBe(0);
      expect(target.followersCount).toBe(0);
    });

    it('throws NotFoundException if either profile is missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.unfollow('u-1', 'p-2')).rejects.toThrow(NotFoundException);
    });
  });
});
