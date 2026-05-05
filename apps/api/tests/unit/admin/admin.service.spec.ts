import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from '../../../src/admin/admin.service';
import { UserEntity } from '../../../src/auth/entities/user.entity';
import { ProfileEntity } from '../../../src/profiles/entities/profile.entity';
import { ListingEntity } from '../../../src/listings/entities/listing.entity';
import { EventEntity } from '../../../src/events/entities/event.entity';
import { PostEntity } from '../../../src/posts/entities/post.entity';

const mockRepo = () => ({
  count: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
});

describe('AdminService', () => {
  let service: AdminService;
  let userRepo: ReturnType<typeof mockRepo>;
  let profileRepo: ReturnType<typeof mockRepo>;
  let listingRepo: ReturnType<typeof mockRepo>;
  let eventRepo: ReturnType<typeof mockRepo>;
  let postRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(UserEntity), useFactory: mockRepo },
        { provide: getRepositoryToken(ProfileEntity), useFactory: mockRepo },
        { provide: getRepositoryToken(ListingEntity), useFactory: mockRepo },
        { provide: getRepositoryToken(EventEntity), useFactory: mockRepo },
        { provide: getRepositoryToken(PostEntity), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get(AdminService);
    userRepo = module.get(getRepositoryToken(UserEntity));
    profileRepo = module.get(getRepositoryToken(ProfileEntity));
    listingRepo = module.get(getRepositoryToken(ListingEntity));
    eventRepo = module.get(getRepositoryToken(EventEntity));
    postRepo = module.get(getRepositoryToken(PostEntity));
  });

  afterEach(() => jest.clearAllMocks());

  // ── getStats ─────────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('returns counts from all five repos', async () => {
      userRepo.count.mockResolvedValue(10);
      profileRepo.count.mockResolvedValue(8);
      listingRepo.count.mockResolvedValue(20);
      eventRepo.count.mockResolvedValue(5);
      postRepo.count.mockResolvedValue(50);

      const result = await service.getStats();

      expect(result).toEqual({ users: 10, profiles: 8, listings: 20, events: 5, posts: 50 });
    });

    it('returns zeros when all counts are zero', async () => {
      [userRepo, profileRepo, listingRepo, eventRepo, postRepo].forEach((r) =>
        r.count.mockResolvedValue(0),
      );

      const result = await service.getStats();
      expect(result).toEqual({ users: 0, profiles: 0, listings: 0, events: 0, posts: 0 });
    });
  });

  // ── getUsers ─────────────────────────────────────────────────────────────────

  describe('getUsers', () => {
    it('returns paginated users with total', async () => {
      const users = [
        { id: 'u1', email: 'a@test.com', role: 'admin' },
        { id: 'u2', email: 'b@test.com', role: 'enthusiast' },
      ];
      userRepo.findAndCount.mockResolvedValue([users, 2]);

      const result = await service.getUsers(1, 20);

      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20, order: { createdAt: 'DESC' } }),
      );
      expect(result).toEqual({ items: users, total: 2, page: 1, limit: 20 });
    });

    it('calculates skip correctly for page 2', async () => {
      userRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getUsers(2, 10);

      expect(userRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ skip: 10 }));
    });
  });

  // ── setUserRole ──────────────────────────────────────────────────────────────

  describe('setUserRole', () => {
    it('updates and returns the user with new role', async () => {
      const user = { id: 'u1', email: 'a@test.com', role: 'enthusiast' };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.setUserRole('u1', 'admin');

      expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
      expect(result).toEqual({ id: 'u1', email: 'a@test.com', role: 'admin' });
    });

    it('throws NotFoundException when user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.setUserRole('bad-id', 'admin')).rejects.toThrow(NotFoundException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('can demote an admin back to enthusiast', async () => {
      const user = { id: 'u1', email: 'a@test.com', role: 'admin' };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.setUserRole('u1', 'enthusiast');
      expect(result.role).toBe('enthusiast');
    });
  });
});
