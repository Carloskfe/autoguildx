import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CommentsService } from '../../../src/posts/comments.service';
import { CommentEntity } from '../../../src/posts/entities/comment.entity';
import { CommentReactionEntity } from '../../../src/posts/entities/comment-reaction.entity';
import { PostEntity } from '../../../src/posts/entities/post.entity';
import { ForumPostEntity } from '../../../src/forums/entities/forum-post.entity';
import { NotificationsService } from '../../../src/notifications/notifications.service';

const mockCommentRepo = () => ({
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

const mockPostRepo = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
});

const mockForumPostRepo = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
});

describe('CommentsService', () => {
  let service: CommentsService;
  let commentRepo: ReturnType<typeof mockCommentRepo>;
  let reactionRepo: ReturnType<typeof mockReactionRepo>;
  let postRepo: ReturnType<typeof mockPostRepo>;
  let forumPostRepo: ReturnType<typeof mockForumPostRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(CommentEntity), useFactory: mockCommentRepo },
        { provide: getRepositoryToken(CommentReactionEntity), useFactory: mockReactionRepo },
        { provide: getRepositoryToken(PostEntity), useFactory: mockPostRepo },
        { provide: getRepositoryToken(ForumPostEntity), useFactory: mockForumPostRepo },
        {
          provide: NotificationsService,
          useValue: { create: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    commentRepo = module.get(getRepositoryToken(CommentEntity));
    reactionRepo = module.get(getRepositoryToken(CommentReactionEntity));
    postRepo = module.get(getRepositoryToken(PostEntity));
    forumPostRepo = module.get(getRepositoryToken(ForumPostEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create — post comment', () => {
    it('saves comment and increments post commentsCount', async () => {
      const post = { id: 'post-1', commentsCount: 2, userId: 'owner' };
      const comment = { id: 'c-1', postId: 'post-1', userId: 'u-1', content: 'Nice!' };

      postRepo.findOne.mockResolvedValue(post);
      commentRepo.create.mockReturnValue(comment);
      commentRepo.save.mockResolvedValue(comment);
      postRepo.save.mockResolvedValue({ ...post, commentsCount: 3 });

      const result = await service.create('post-1', 'u-1', { content: 'Nice!' });

      expect(result).toEqual(comment);
      expect(post.commentsCount).toBe(3);
    });

    it('stores parentId on reply', async () => {
      const post = { id: 'post-1', commentsCount: 0, userId: 'owner' };
      const reply = { id: 'c-2', postId: 'post-1', parentId: 'c-1', content: 'Reply!' };

      postRepo.findOne.mockResolvedValue(post);
      commentRepo.create.mockReturnValue(reply);
      commentRepo.save.mockResolvedValue(reply);
      postRepo.save.mockResolvedValue(post);

      await service.create('post-1', 'u-1', { content: 'Reply!', parentId: 'c-1' });

      expect(commentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ parentId: 'c-1' }),
      );
    });

    it('throws NotFoundException when post does not exist', async () => {
      postRepo.findOne.mockResolvedValue(null);
      await expect(service.create('bad-id', 'u-1', { content: 'x' })).rejects.toThrow(
        NotFoundException,
      );
      expect(commentRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('create — forum post comment', () => {
    it('saves comment and increments forum post commentCount', async () => {
      const forumPost = { id: 'fp-1', commentCount: 0 };
      const comment = { id: 'c-3', forumPostId: 'fp-1', content: 'Hi!' };

      forumPostRepo.findOne.mockResolvedValue(forumPost);
      commentRepo.create.mockReturnValue(comment);
      commentRepo.save.mockResolvedValue(comment);
      forumPostRepo.save.mockResolvedValue(forumPost);

      const result = await service.create(null, 'u-1', { content: 'Hi!' }, 'fp-1');

      expect(result).toEqual(comment);
      expect(forumPost.commentCount).toBe(1);
    });

    it('throws NotFoundException when forum post does not exist', async () => {
      forumPostRepo.findOne.mockResolvedValue(null);
      await expect(service.create(null, 'u-1', { content: 'x' }, 'bad')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByPost — nested tree', () => {
    it('returns root comments with replies populated', async () => {
      const root = { id: 'c-1', parentId: null, replies: [] };
      const child = { id: 'c-2', parentId: 'c-1', replies: [] };
      commentRepo.find.mockResolvedValue([root, child]);

      const result = await service.findByPost('post-1', 1, 20);

      expect(result).toHaveLength(1);
      expect(result[0].replies).toHaveLength(1);
      expect(result[0].replies[0].id).toBe('c-2');
    });

    it('returns empty array when no comments exist', async () => {
      commentRepo.find.mockResolvedValue([]);
      const result = await service.findByPost('post-1');
      expect(result).toEqual([]);
    });

    it('applies pagination to the query', async () => {
      commentRepo.find.mockResolvedValue([]);
      await service.findByPost('post-1', 2, 10);
      expect(commentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  describe('findByForumPost', () => {
    it('returns nested tree for forum post comments', async () => {
      const root = { id: 'c-1', parentId: null, replies: [] };
      const child = { id: 'c-2', parentId: 'c-1', replies: [] };
      commentRepo.find.mockResolvedValue([root, child]);

      const result = await service.findByForumPost('fp-1');

      expect(result).toHaveLength(1);
      expect(result[0].replies[0].id).toBe('c-2');
    });
  });

  describe('reactToComment', () => {
    it('creates new reaction when none exists', async () => {
      const reaction = { id: 'r-1', commentId: 'c-1', userId: 'u-1', emoji: 'fire' };
      reactionRepo.findOne.mockResolvedValue(null);
      reactionRepo.create.mockReturnValue(reaction);
      reactionRepo.save.mockResolvedValue(reaction);

      const result = await service.reactToComment('c-1', 'u-1', 'fire');
      expect(result).toEqual(reaction);
    });

    it('updates emoji when reaction already exists (upsert)', async () => {
      const existing = { id: 'r-1', emoji: 'like' };
      reactionRepo.findOne.mockResolvedValue(existing);
      reactionRepo.save.mockResolvedValue({ ...existing, emoji: 'love' });

      await service.reactToComment('c-1', 'u-1', 'love');

      expect(existing.emoji).toBe('love');
      expect(reactionRepo.save).toHaveBeenCalledWith(existing);
    });

    it('throws NotFoundException for invalid emoji', async () => {
      await expect(service.reactToComment('c-1', 'u-1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unreactToComment', () => {
    it('removes existing reaction and returns { removed: true }', async () => {
      const reaction = { id: 'r-1' };
      reactionRepo.findOne.mockResolvedValue(reaction);
      reactionRepo.remove.mockResolvedValue(undefined);

      const result = await service.unreactToComment('c-1', 'u-1');
      expect(result).toEqual({ removed: true });
      expect(reactionRepo.remove).toHaveBeenCalledWith(reaction);
    });

    it('returns { removed: true } even when no reaction exists', async () => {
      reactionRepo.findOne.mockResolvedValue(null);
      const result = await service.unreactToComment('c-1', 'u-1');
      expect(result).toEqual({ removed: true });
    });
  });

  describe('getCommentReactions', () => {
    it('returns counts grouped by emoji', async () => {
      reactionRepo.find.mockResolvedValue([
        { emoji: 'fire' },
        { emoji: 'fire' },
        { emoji: 'love' },
      ]);

      const result = await service.getCommentReactions('c-1');
      expect(result.total).toBe(3);
      expect(result.counts['fire']).toBe(2);
      expect(result.counts['love']).toBe(1);
    });

    it('returns zero totals when no reactions exist', async () => {
      reactionRepo.find.mockResolvedValue([]);
      const result = await service.getCommentReactions('c-1');
      expect(result.total).toBe(0);
      expect(result.counts).toEqual({});
    });
  });

  describe('getMyCommentReaction', () => {
    it('returns reaction when it exists', async () => {
      const reaction = { id: 'r-1', emoji: 'fire' };
      reactionRepo.findOne.mockResolvedValue(reaction);
      const result = await service.getMyCommentReaction('c-1', 'u-1');
      expect(result).toEqual(reaction);
    });

    it('returns null when none exists', async () => {
      reactionRepo.findOne.mockResolvedValue(null);
      const result = await service.getMyCommentReaction('c-1', 'u-1');
      expect(result).toBeNull();
    });
  });
});
