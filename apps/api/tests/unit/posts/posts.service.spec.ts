import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostsService } from '../../../src/posts/posts.service';
import { PostEntity } from '../../../src/posts/entities/post.entity';
import { PostReactionEntity } from '../../../src/posts/entities/post-reaction.entity';
import { NotificationsService } from '../../../src/notifications/notifications.service';

const qbMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
});

const mockPostRepo = () => ({
  createQueryBuilder: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

const mockReactionRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('PostsService', () => {
  let service: PostsService;
  let repo: ReturnType<typeof mockPostRepo>;
  let reactionRepo: ReturnType<typeof mockReactionRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(PostEntity), useFactory: mockPostRepo },
        { provide: getRepositoryToken(PostReactionEntity), useFactory: mockReactionRepo },
        { provide: NotificationsService, useValue: { create: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    repo = module.get(getRepositoryToken(PostEntity));
    reactionRepo = module.get(getRepositoryToken(PostReactionEntity));
  });

  afterEach(() => jest.clearAllMocks());

  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('saves and returns the new post with default public visibility', async () => {
      const post = { id: 'p1', userId: 'u-1', content: 'Hello', visibility: 'public' };
      repo.create.mockReturnValue(post);
      repo.save.mockResolvedValue(post);
      const result = await service.create('u-1', { content: 'Hello' });
      expect(result).toEqual(post);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ visibility: 'public', mediaMode: 'single' }));
    });

    it('respects explicit visibility setting', async () => {
      const post = { id: 'p1', userId: 'u-1', content: 'Private', visibility: 'private' };
      repo.create.mockReturnValue(post);
      repo.save.mockResolvedValue(post);
      await service.create('u-1', { content: 'Private', visibility: 'private' });
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ visibility: 'private' }));
    });

    it('includes mediaUrls when provided', async () => {
      const urls = ['https://cdn.example.com/img.jpg'];
      const post = { id: 'p1', userId: 'u-1', content: 'Photo', mediaUrls: urls };
      repo.create.mockReturnValue(post);
      repo.save.mockResolvedValue(post);
      const result = await service.create('u-1', { content: 'Photo', mediaUrls: urls });
      expect(result.mediaUrls).toEqual(urls);
    });

    it('extracts YouTube linkUrl and sets linkPreviewType to youtube', async () => {
      const content = 'Check this out https://www.youtube.com/watch?v=dQw4w9WgXcQ awesome build';
      const post = { id: 'p1', userId: 'u-1', content };
      repo.create.mockReturnValue(post);
      repo.save.mockResolvedValue(post);
      await service.create('u-1', { content });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          linkUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          linkPreviewType: 'youtube',
        }),
      );
    });

    it('extracts a generic link and sets linkPreviewType to link', async () => {
      const content = 'See https://autoguildx.com/listing/123 for details';
      const post = { id: 'p1', userId: 'u-1', content };
      repo.create.mockReturnValue(post);
      repo.save.mockResolvedValue(post);
      await service.create('u-1', { content });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ linkUrl: 'https://autoguildx.com/listing/123', linkPreviewType: 'link' }),
      );
    });

    it('sets no linkUrl when content has no URL', async () => {
      const post = { id: 'p1', userId: 'u-1', content: 'No links here' };
      repo.create.mockReturnValue(post);
      repo.save.mockResolvedValue(post);
      await service.create('u-1', { content: 'No links here' });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ linkUrl: undefined, linkPreviewType: undefined }),
      );
    });

    it('respects carousel mediaMode', async () => {
      const post = { id: 'p1', userId: 'u-1', content: 'Build', mediaMode: 'carousel' };
      repo.create.mockReturnValue(post);
      repo.save.mockResolvedValue(post);
      await service.create('u-1', { content: 'Build', mediaMode: 'carousel' });
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ mediaMode: 'carousel' }));
    });

    it('saves sharedContentType, sharedContentId, and sharedContent when provided', async () => {
      const snapshot = JSON.stringify({ type: 'listing', id: 'l-1', title: 'LS3 Engine' });
      const post = { id: 'p1', userId: 'u-1', content: 'Great deal!', sharedContentType: 'listing', sharedContentId: 'l-1', sharedContent: snapshot };
      repo.create.mockReturnValue(post);
      repo.save.mockResolvedValue(post);
      await service.create('u-1', {
        content: 'Great deal!',
        sharedContentType: 'listing',
        sharedContentId: 'l-1',
        sharedContent: snapshot,
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sharedContentType: 'listing',
          sharedContentId: 'l-1',
          sharedContent: snapshot,
        }),
      );
    });

    it('allows sharing an event to the feed', async () => {
      const snapshot = JSON.stringify({ type: 'event', id: 'e-1', title: 'Cars & Coffee' });
      const post = { id: 'p2', userId: 'u-2', content: '', sharedContentType: 'event', sharedContentId: 'e-1' };
      repo.create.mockReturnValue(post);
      repo.save.mockResolvedValue(post);
      await service.create('u-2', {
        content: '',
        sharedContentType: 'event',
        sharedContentId: 'e-1',
        sharedContent: snapshot,
      });
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ sharedContentType: 'event' }));
    });
  });

  // ---------------------------------------------------------------------------
  describe('getFeed', () => {
    it('returns posts via query builder', async () => {
      const qb = qbMock();
      const posts = [{ id: 'p1' }];
      qb.getMany.mockResolvedValue(posts);
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getFeed(undefined, 1, 20);
      expect(result).toEqual(posts);
      expect(qb.where).toHaveBeenCalledWith('post.visibility = :pub', { pub: 'public' });
    });

    it('filters by followingUserIds when provided', async () => {
      const qb = qbMock();
      repo.createQueryBuilder.mockReturnValue(qb);
      await service.getFeed(['u-2', 'u-3'], 1, 20);
      expect(qb.andWhere).toHaveBeenCalledWith('post.userId IN (:...ids)', { ids: ['u-2', 'u-3'] });
    });

    it('does not add andWhere when followingUserIds is empty', async () => {
      const qb = qbMock();
      repo.createQueryBuilder.mockReturnValue(qb);
      await service.getFeed([], 1, 20);
      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('applies correct pagination for page 2', async () => {
      const qb = qbMock();
      repo.createQueryBuilder.mockReturnValue(qb);
      await service.getFeed(undefined, 2, 10);
      expect(qb.skip).toHaveBeenCalledWith(10);
      expect(qb.take).toHaveBeenCalledWith(10);
    });

    it('falls back to page 1 / limit 20 on NaN input', async () => {
      const qb = qbMock();
      repo.createQueryBuilder.mockReturnValue(qb);
      await service.getFeed(undefined, NaN, NaN);
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(20);
    });
  });

  // ---------------------------------------------------------------------------
  describe('getUserPosts', () => {
    it('returns posts filtered by userId', async () => {
      const posts = [{ id: 'p1', userId: 'u-1' }];
      repo.find.mockResolvedValue(posts);
      const result = await service.getUserPosts('u-1');
      expect(result).toEqual(posts);
    });

    it('applies pagination', async () => {
      repo.find.mockResolvedValue([]);
      await service.getUserPosts('u-1', 3, 5);
      expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 5 }));
    });
  });

  // ---------------------------------------------------------------------------
  describe('like', () => {
    it('increments likesCount and saves', async () => {
      const post = { id: 'p1', likesCount: 5 };
      repo.findOne.mockResolvedValue(post);
      repo.save.mockImplementation((p) => Promise.resolve(p));
      const result = await service.like('p1');
      expect(result.likesCount).toBe(6);
    });

    it('throws NotFoundException when post does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.like('bad')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  describe('react', () => {
    it('creates a new reaction when none exists', async () => {
      repo.findOne.mockResolvedValue({ id: 'p1', visibility: 'public' });
      reactionRepo.findOne.mockResolvedValue(null);
      const reaction = { postId: 'p1', userId: 'u-1', emoji: 'fire' };
      reactionRepo.create.mockReturnValue(reaction);
      reactionRepo.save.mockResolvedValue(reaction);
      const result = await service.react('p1', 'u-1', 'fire');
      expect(result.emoji).toBe('fire');
    });

    it('updates emoji when user already reacted', async () => {
      repo.findOne.mockResolvedValue({ id: 'p1' });
      const existing = { postId: 'p1', userId: 'u-1', emoji: 'like' };
      reactionRepo.findOne.mockResolvedValue(existing);
      reactionRepo.save.mockImplementation((r) => Promise.resolve(r));
      const result = await service.react('p1', 'u-1', 'fire');
      expect(result.emoji).toBe('fire');
    });

    it('throws NotFoundException when post does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.react('bad', 'u-1', 'fire')).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  describe('unreact', () => {
    it('removes an existing reaction', async () => {
      const reaction = { postId: 'p1', userId: 'u-1', emoji: 'fire' };
      reactionRepo.findOne.mockResolvedValue(reaction);
      reactionRepo.remove.mockResolvedValue(reaction);
      expect(await service.unreact('p1', 'u-1')).toEqual({ removed: true });
    });

    it('returns removed:true even when no reaction exists', async () => {
      reactionRepo.findOne.mockResolvedValue(null);
      expect(await service.unreact('p1', 'u-1')).toEqual({ removed: true });
    });
  });

  // ---------------------------------------------------------------------------
  describe('getReactions', () => {
    it('returns counts grouped by emoji', async () => {
      reactionRepo.find.mockResolvedValue([
        { emoji: 'fire' }, { emoji: 'fire' }, { emoji: 'love' },
      ]);
      const result = await service.getReactions('p1');
      expect(result.total).toBe(3);
      expect(result.counts.fire).toBe(2);
      expect(result.counts.love).toBe(1);
    });

    it('returns zero counts when no reactions exist', async () => {
      reactionRepo.find.mockResolvedValue([]);
      const result = await service.getReactions('p1');
      expect(result.total).toBe(0);
      expect(result.counts).toEqual({});
    });
  });

  // ---------------------------------------------------------------------------
  describe('share', () => {
    it('creates a re-post and increments sharesCount', async () => {
      const original = { id: 'p1', visibility: 'public', sharesCount: 0 };
      repo.findOne.mockResolvedValue(original);
      repo.save.mockImplementation((p) => Promise.resolve(p));
      const newPost = { id: 'p2', sharedPostId: 'p1', userId: 'u-1', content: '' };
      repo.create.mockReturnValue(newPost);

      const result = await service.share('p1', 'u-1');
      expect(original.sharesCount).toBe(1);
      expect(repo.save).toHaveBeenCalledWith(original);
      expect(result).toEqual(newPost);
    });

    it('throws NotFoundException when original post does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.share('bad', 'u-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when original post is not public', async () => {
      repo.findOne.mockResolvedValue({ id: 'p1', visibility: 'private', sharesCount: 0 });
      await expect(service.share('p1', 'u-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('removes the post when the user owns it', async () => {
      const post = { id: 'p1', userId: 'u-1' };
      repo.findOne.mockResolvedValue(post);
      repo.remove.mockResolvedValue(undefined);
      expect(await service.delete('p1', 'u-1')).toEqual({ deleted: true });
    });

    it('throws NotFoundException when post does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.delete('bad', 'u-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user does not own the post', async () => {
      repo.findOne.mockResolvedValue({ id: 'p1', userId: 'u-2' });
      await expect(service.delete('p1', 'u-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
