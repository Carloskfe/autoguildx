import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ForumsService } from '../../../src/forums/forums.service';
import { ForumEntity } from '../../../src/forums/entities/forum.entity';
import { ForumMemberEntity } from '../../../src/forums/entities/forum-member.entity';
import { ForumPostEntity } from '../../../src/forums/entities/forum-post.entity';
import { ForumVoteEntity } from '../../../src/forums/entities/forum-vote.entity';
import { ForumCommentVoteEntity } from '../../../src/forums/entities/forum-comment-vote.entity';
import { CommentEntity } from '../../../src/posts/entities/comment.entity';

const makeRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('ForumsService', () => {
  let service: ForumsService;
  let forumRepo: ReturnType<typeof makeRepo>;
  let memberRepo: ReturnType<typeof makeRepo>;
  let postRepo: ReturnType<typeof makeRepo>;
  let voteRepo: ReturnType<typeof makeRepo>;
  let commentVoteRepo: ReturnType<typeof makeRepo>;
  let commentRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForumsService,
        { provide: getRepositoryToken(ForumEntity), useFactory: makeRepo },
        { provide: getRepositoryToken(ForumMemberEntity), useFactory: makeRepo },
        { provide: getRepositoryToken(ForumPostEntity), useFactory: makeRepo },
        { provide: getRepositoryToken(ForumVoteEntity), useFactory: makeRepo },
        { provide: getRepositoryToken(ForumCommentVoteEntity), useFactory: makeRepo },
        { provide: getRepositoryToken(CommentEntity), useFactory: makeRepo },
      ],
    }).compile();

    service = module.get<ForumsService>(ForumsService);
    forumRepo = module.get(getRepositoryToken(ForumEntity));
    memberRepo = module.get(getRepositoryToken(ForumMemberEntity));
    postRepo = module.get(getRepositoryToken(ForumPostEntity));
    voteRepo = module.get(getRepositoryToken(ForumVoteEntity));
    commentVoteRepo = module.get(getRepositoryToken(ForumCommentVoteEntity));
    commentRepo = module.get(getRepositoryToken(CommentEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('createForum', () => {
    it('creates and returns forum', async () => {
      const dto = { name: 'Wrenches', slug: 'wrenches', description: 'Tools', category: 'tech' };
      const forum = { id: 'f-1', ...dto, createdByUserId: 'u-1' };
      forumRepo.findOne.mockResolvedValue(null);
      forumRepo.create.mockReturnValue(forum);
      forumRepo.save.mockResolvedValue(forum);

      const result = await service.createForum('u-1', dto as any);
      expect(result).toEqual(forum);
      expect(forumRepo.create).toHaveBeenCalledWith(expect.objectContaining({ createdByUserId: 'u-1' }));
    });

    it('throws ConflictException when slug is already taken', async () => {
      forumRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(service.createForum('u-1', { slug: 'taken' } as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('listForums', () => {
    it('returns all forums when no category filter', async () => {
      const forums = [{ id: 'f-1' }, { id: 'f-2' }];
      forumRepo.find.mockResolvedValue(forums);

      const result = await service.listForums();
      expect(result).toHaveLength(2);
    });

    it('injects isMember: true when user is a member', async () => {
      const forums = [{ id: 'f-1' }];
      forumRepo.find.mockResolvedValue(forums);
      memberRepo.find.mockResolvedValue([{ forumId: 'f-1' }]);

      const result = await service.listForums(undefined, 'u-1');
      expect(result[0].isMember).toBe(true);
    });

    it('injects isMember: false when user is not a member', async () => {
      const forums = [{ id: 'f-1' }];
      forumRepo.find.mockResolvedValue(forums);
      memberRepo.find.mockResolvedValue([]);

      const result = await service.listForums(undefined, 'u-1');
      expect(result[0].isMember).toBe(false);
    });
  });

  describe('getForumBySlug', () => {
    it('returns forum with isMember when found', async () => {
      const forum = { id: 'f-1', slug: 'wrenches' };
      forumRepo.findOne.mockResolvedValue(forum);
      memberRepo.findOne.mockResolvedValue({ id: 'm-1' });

      const result = await service.getForumBySlug('wrenches', 'u-1');
      expect(result.isMember).toBe(true);
    });

    it('throws NotFoundException when slug not found', async () => {
      forumRepo.findOne.mockResolvedValue(null);
      await expect(service.getForumBySlug('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateForum', () => {
    it('updates and returns forum when caller is creator', async () => {
      const forum = { id: 'f-1', createdByUserId: 'u-1', name: 'Old' };
      forumRepo.findOne.mockResolvedValue(forum);
      forumRepo.save.mockResolvedValue({ ...forum, name: 'New' });

      const result = await service.updateForum('wrenches', 'u-1', { name: 'New' } as any);
      expect(result.name).toBe('New');
    });

    it('throws ForbiddenException when caller is not creator', async () => {
      forumRepo.findOne.mockResolvedValue({ id: 'f-1', createdByUserId: 'owner' });
      await expect(service.updateForum('wrenches', 'other', {} as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when forum not found', async () => {
      forumRepo.findOne.mockResolvedValue(null);
      await expect(service.updateForum('nope', 'u-1', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteForum', () => {
    it('deletes when caller is creator', async () => {
      const forum = { id: 'f-1', createdByUserId: 'u-1' };
      forumRepo.findOne.mockResolvedValue(forum);
      forumRepo.remove.mockResolvedValue(undefined);

      const result = await service.deleteForum('wrenches', 'u-1');
      expect(result).toEqual({ deleted: true });
    });

    it('throws ForbiddenException when not creator', async () => {
      forumRepo.findOne.mockResolvedValue({ createdByUserId: 'owner' });
      await expect(service.deleteForum('wrenches', 'other')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('joinForum', () => {
    it('creates membership and increments memberCount', async () => {
      const forum = { id: 'f-1', memberCount: 5 };
      forumRepo.findOne.mockResolvedValue(forum);
      memberRepo.findOne.mockResolvedValue(null);
      memberRepo.create.mockReturnValue({ forumId: 'f-1', userId: 'u-1' });
      memberRepo.save.mockResolvedValue(undefined);
      forumRepo.save.mockResolvedValue(undefined);

      const result = await service.joinForum('wrenches', 'u-1');
      expect(result).toEqual({ joined: true });
      expect(forum.memberCount).toBe(6);
    });

    it('is idempotent when already a member', async () => {
      forumRepo.findOne.mockResolvedValue({ id: 'f-1', memberCount: 5 });
      memberRepo.findOne.mockResolvedValue({ id: 'm-1' });

      const result = await service.joinForum('wrenches', 'u-1');
      expect(result).toEqual({ joined: true });
      expect(memberRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('leaveForum', () => {
    it('removes membership and decrements memberCount', async () => {
      const forum = { id: 'f-1', memberCount: 5 };
      const member = { id: 'm-1' };
      forumRepo.findOne.mockResolvedValue(forum);
      memberRepo.findOne.mockResolvedValue(member);
      memberRepo.remove.mockResolvedValue(undefined);
      forumRepo.save.mockResolvedValue(undefined);

      const result = await service.leaveForum('wrenches', 'u-1');
      expect(result).toEqual({ left: true });
      expect(forum.memberCount).toBe(4);
    });

    it('returns { left: true } when not a member', async () => {
      forumRepo.findOne.mockResolvedValue({ id: 'f-1', memberCount: 0 });
      memberRepo.findOne.mockResolvedValue(null);

      const result = await service.leaveForum('wrenches', 'u-1');
      expect(result).toEqual({ left: true });
    });
  });

  describe('createPost', () => {
    it('creates post and increments forum postCount', async () => {
      const forum = { id: 'f-1', postCount: 3 };
      const post = { id: 'p-1', title: 'Hello' };
      forumRepo.findOne.mockResolvedValue(forum);
      postRepo.create.mockReturnValue(post);
      postRepo.save.mockResolvedValue(post);
      forumRepo.save.mockResolvedValue(undefined);

      const result = await service.createPost('wrenches', 'u-1', {
        title: 'Hello',
        content: 'World',
      } as any);
      expect(result).toEqual(post);
      expect(forum.postCount).toBe(4);
    });

    it('throws NotFoundException when forum not found', async () => {
      forumRepo.findOne.mockResolvedValue(null);
      await expect(service.createPost('nope', 'u-1', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listPosts', () => {
    const makePosts = () => [
      { id: 'p-1', voteScore: 10, createdAt: new Date(Date.now() - 3600000) },
      { id: 'p-2', voteScore: 1, createdAt: new Date() },
    ];

    const makeQb = (posts: any[]) => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(posts),
    });

    it('returns posts sorted by voteScore for sort=top', async () => {
      const posts = makePosts();
      const qb = makeQb(posts);
      forumRepo.findOne.mockResolvedValue({ id: 'f-1' });
      postRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);
      voteRepo.find.mockResolvedValue([]);

      const result = await service.listPosts('w', 'top', 1, undefined);
      expect(qb.orderBy).toHaveBeenCalledWith('p.voteScore', 'DESC');
      expect(result).toHaveLength(2);
    });

    it('injects myVote correctly when userId provided', async () => {
      const posts = [{ id: 'p-1', voteScore: 5, createdAt: new Date() }];
      const qb = makeQb(posts);
      forumRepo.findOne.mockResolvedValue({ id: 'f-1' });
      postRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);
      voteRepo.find.mockResolvedValue([{ forumPostId: 'p-1', value: 1 }]);

      const result = await service.listPosts('w', 'new', 1, 'u-1');
      expect(result[0].myVote).toBe(1);
    });
  });

  describe('getPost', () => {
    it('returns post with myVote when userId provided', async () => {
      const forum = { id: 'f-1' };
      const post = { id: 'p-1', forumId: 'f-1' };
      forumRepo.findOne.mockResolvedValue(forum);
      postRepo.findOne.mockResolvedValue(post);
      voteRepo.findOne.mockResolvedValue({ value: -1 });

      const result = await service.getPost('w', 'p-1', 'u-1');
      expect(result.myVote).toBe(-1);
    });

    it('returns myVote: null when not voted', async () => {
      forumRepo.findOne.mockResolvedValue({ id: 'f-1' });
      postRepo.findOne.mockResolvedValue({ id: 'p-1' });
      voteRepo.findOne.mockResolvedValue(null);

      const result = await service.getPost('w', 'p-1', 'u-1');
      expect(result.myVote).toBeNull();
    });

    it('throws NotFoundException when post not found', async () => {
      forumRepo.findOne.mockResolvedValue({ id: 'f-1' });
      postRepo.findOne.mockResolvedValue(null);
      await expect(service.getPost('w', 'bad', 'u-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deletePost', () => {
    it('removes post and decrements forum postCount', async () => {
      const forum = { id: 'f-1', postCount: 2 };
      const post = { id: 'p-1', forumId: 'f-1', userId: 'u-1' };
      forumRepo.findOne.mockResolvedValue(forum);
      postRepo.findOne.mockResolvedValue(post);
      postRepo.remove.mockResolvedValue(undefined);
      forumRepo.save.mockResolvedValue(undefined);

      const result = await service.deletePost('w', 'p-1', 'u-1');
      expect(result).toEqual({ deleted: true });
      expect(forum.postCount).toBe(1);
    });

    it('throws ForbiddenException when not author', async () => {
      forumRepo.findOne.mockResolvedValue({ id: 'f-1' });
      postRepo.findOne.mockResolvedValue({ id: 'p-1', forumId: 'f-1', userId: 'owner' });
      await expect(service.deletePost('w', 'p-1', 'other')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('voteOnPost', () => {
    it('inserts new vote and sets voteScore = +1', async () => {
      const forum = { id: 'f-1' };
      const post = { id: 'p-1', forumId: 'f-1', voteScore: 0 };
      forumRepo.findOne.mockResolvedValue(forum);
      postRepo.findOne.mockResolvedValue(post);
      voteRepo.findOne.mockResolvedValue(null);
      voteRepo.create.mockReturnValue({ forumPostId: 'p-1', userId: 'u-1', value: 1 });
      voteRepo.save.mockResolvedValue(undefined);
      postRepo.save.mockResolvedValue({ ...post, voteScore: 1 });

      await service.voteOnPost('w', 'p-1', 'u-1', 1);
      expect(post.voteScore).toBe(1);
    });

    it('adjusts voteScore by delta when updating existing vote', async () => {
      const forum = { id: 'f-1' };
      const post = { id: 'p-1', forumId: 'f-1', voteScore: 1 };
      const existing = { value: 1 };
      forumRepo.findOne.mockResolvedValue(forum);
      postRepo.findOne.mockResolvedValue(post);
      voteRepo.findOne.mockResolvedValue(existing);
      voteRepo.save.mockResolvedValue(undefined);
      postRepo.save.mockResolvedValue(undefined);

      await service.voteOnPost('w', 'p-1', 'u-1', -1);
      expect(post.voteScore).toBe(-1);
      expect(existing.value).toBe(-1);
    });

    it('throws NotFoundException when post not found', async () => {
      forumRepo.findOne.mockResolvedValue({ id: 'f-1' });
      postRepo.findOne.mockResolvedValue(null);
      await expect(service.voteOnPost('w', 'bad', 'u-1', 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeVoteOnPost', () => {
    it('removes vote and adjusts voteScore', async () => {
      const forum = { id: 'f-1' };
      const post = { id: 'p-1', forumId: 'f-1', voteScore: 1 };
      const existing = { value: 1 };
      forumRepo.findOne.mockResolvedValue(forum);
      postRepo.findOne.mockResolvedValue(post);
      voteRepo.findOne.mockResolvedValue(existing);
      voteRepo.remove.mockResolvedValue(undefined);
      postRepo.save.mockResolvedValue(undefined);

      const result = await service.removeVoteOnPost('w', 'p-1', 'u-1');
      expect(result).toEqual({ removed: true });
      expect(post.voteScore).toBe(0);
    });

    it('returns { removed: false } when no vote exists', async () => {
      forumRepo.findOne.mockResolvedValue({ id: 'f-1' });
      postRepo.findOne.mockResolvedValue({ id: 'p-1', forumId: 'f-1', voteScore: 0 });
      voteRepo.findOne.mockResolvedValue(null);

      const result = await service.removeVoteOnPost('w', 'p-1', 'u-1');
      expect(result).toEqual({ removed: false });
    });
  });

  describe('voteOnComment', () => {
    it('inserts vote and increments comment voteScore', async () => {
      const comment = { id: 'c-1', voteScore: 0 };
      commentRepo.findOne.mockResolvedValue(comment);
      commentVoteRepo.findOne.mockResolvedValue(null);
      commentVoteRepo.create.mockReturnValue({ commentId: 'c-1', userId: 'u-1', value: 1 });
      commentVoteRepo.save.mockResolvedValue(undefined);
      commentRepo.save.mockResolvedValue({ ...comment, voteScore: 1 });

      await service.voteOnComment('c-1', 'u-1', 1);
      expect(comment.voteScore).toBe(1);
    });

    it('adjusts by delta when updating existing vote', async () => {
      const comment = { id: 'c-1', voteScore: 1 };
      const existing = { value: 1 };
      commentRepo.findOne.mockResolvedValue(comment);
      commentVoteRepo.findOne.mockResolvedValue(existing);
      commentVoteRepo.save.mockResolvedValue(undefined);
      commentRepo.save.mockResolvedValue(undefined);

      await service.voteOnComment('c-1', 'u-1', -1);
      expect(comment.voteScore).toBe(-1);
    });

    it('throws NotFoundException when comment not found', async () => {
      commentRepo.findOne.mockResolvedValue(null);
      await expect(service.voteOnComment('bad', 'u-1', 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeVoteOnComment', () => {
    it('removes vote and adjusts voteScore', async () => {
      const comment = { id: 'c-1', voteScore: 1 };
      commentRepo.findOne.mockResolvedValue(comment);
      commentVoteRepo.findOne.mockResolvedValue({ value: 1 });
      commentVoteRepo.remove.mockResolvedValue(undefined);
      commentRepo.save.mockResolvedValue(undefined);

      const result = await service.removeVoteOnComment('c-1', 'u-1');
      expect(result).toEqual({ removed: true });
      expect(comment.voteScore).toBe(0);
    });

    it('returns { removed: false } when no vote exists', async () => {
      commentRepo.findOne.mockResolvedValue({ id: 'c-1', voteScore: 0 });
      commentVoteRepo.findOne.mockResolvedValue(null);

      const result = await service.removeVoteOnComment('c-1', 'u-1');
      expect(result).toEqual({ removed: false });
    });
  });
});
