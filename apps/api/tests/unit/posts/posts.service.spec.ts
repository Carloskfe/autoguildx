import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostsService } from '../../../src/posts/posts.service';
import { PostEntity } from '../../../src/posts/entities/post.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('PostsService', () => {
  let service: PostsService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(PostEntity), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    repo = module.get(getRepositoryToken(PostEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('saves and returns the new post', async () => {
      const post = { id: 'post-1', userId: 'u-1', content: 'Hello' };
      repo.create.mockReturnValue(post);
      repo.save.mockResolvedValue(post);

      const result = await service.create('u-1', { content: 'Hello' });
      expect(result).toEqual(post);
      expect(repo.create).toHaveBeenCalledWith({ content: 'Hello', userId: 'u-1' });
    });
  });

  describe('getFeed', () => {
    it('returns paginated posts ordered by createdAt desc', async () => {
      const posts = [{ id: 'p1' }, { id: 'p2' }];
      repo.find.mockResolvedValue(posts);

      const result = await service.getFeed(1, 20);
      expect(result).toEqual(posts);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20, order: { createdAt: 'DESC' } }),
      );
    });

    it('applies correct pagination offset for page 2', async () => {
      repo.find.mockResolvedValue([]);
      await service.getFeed(2, 10);
      expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
    });
  });

  describe('getUserPosts', () => {
    it('returns posts filtered by userId', async () => {
      const posts = [{ id: 'p1', userId: 'u-1' }];
      repo.find.mockResolvedValue(posts);

      const result = await service.getUserPosts('u-1');
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u-1' } }),
      );
      expect(result).toEqual(posts);
    });

    it('applies pagination when page and limit are provided', async () => {
      repo.find.mockResolvedValue([]);
      await service.getUserPosts('u-1', 3, 5);
      expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 5 }));
    });
  });

  describe('like', () => {
    it('increments likesCount and saves', async () => {
      const post = { id: 'post-1', likesCount: 5 };
      repo.findOne.mockResolvedValue(post);
      repo.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.like('post-1');
      expect(result.likesCount).toBe(6);
      expect(repo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when post does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.like('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('removes the post when the user owns it', async () => {
      const post = { id: 'post-1', userId: 'u-1' };
      repo.findOne.mockResolvedValue(post);
      repo.remove.mockResolvedValue(undefined);

      const result = await service.delete('post-1', 'u-1');
      expect(result).toEqual({ deleted: true });
      expect(repo.remove).toHaveBeenCalledWith(post);
    });

    it('throws NotFoundException when post does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.delete('bad-id', 'u-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user does not own the post', async () => {
      repo.findOne.mockResolvedValue({ id: 'post-1', userId: 'u-2' });
      await expect(service.delete('post-1', 'u-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
