import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CommentsService } from '../../../src/posts/comments.service';
import { CommentEntity } from '../../../src/posts/entities/comment.entity';
import { PostEntity } from '../../../src/posts/entities/post.entity';
import { NotificationsService } from '../../../src/notifications/notifications.service';

const mockCommentRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockPostRepo = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
});

describe('CommentsService', () => {
  let service: CommentsService;
  let commentRepo: ReturnType<typeof mockCommentRepo>;
  let postRepo: ReturnType<typeof mockPostRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(CommentEntity), useFactory: mockCommentRepo },
        { provide: getRepositoryToken(PostEntity), useFactory: mockPostRepo },
        { provide: NotificationsService, useValue: { create: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    commentRepo = module.get(getRepositoryToken(CommentEntity));
    postRepo = module.get(getRepositoryToken(PostEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('saves comment and increments post commentsCount', async () => {
      const post = { id: 'post-1', commentsCount: 2 };
      const comment = { id: 'c-1', postId: 'post-1', userId: 'u-1', content: 'Nice post!' };

      postRepo.findOne.mockResolvedValue(post);
      commentRepo.create.mockReturnValue(comment);
      commentRepo.save.mockResolvedValue(comment);
      postRepo.save.mockResolvedValue({ ...post, commentsCount: 3 });

      const result = await service.create('post-1', 'u-1', { content: 'Nice post!' });

      expect(result).toEqual(comment);
      expect(post.commentsCount).toBe(3);
      expect(postRepo.save).toHaveBeenCalledWith(post);
    });

    it('throws NotFoundException when post does not exist', async () => {
      postRepo.findOne.mockResolvedValue(null);
      await expect(service.create('bad-id', 'u-1', { content: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does not save comment if post is not found', async () => {
      postRepo.findOne.mockResolvedValue(null);
      await expect(service.create('bad-id', 'u-1', { content: 'x' })).rejects.toThrow();
      expect(commentRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findByPost', () => {
    it('returns paginated comments in ascending order', async () => {
      const comments = [{ id: 'c-1' }, { id: 'c-2' }];
      commentRepo.find.mockResolvedValue(comments);

      const result = await service.findByPost('post-1', 1, 20);

      expect(result).toEqual(comments);
      expect(commentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { postId: 'post-1' },
          order: { createdAt: 'ASC' },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('applies correct pagination offset for page 2', async () => {
      commentRepo.find.mockResolvedValue([]);
      await service.findByPost('post-1', 2, 10);
      expect(commentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('returns empty array when no comments exist', async () => {
      commentRepo.find.mockResolvedValue([]);
      const result = await service.findByPost('post-1');
      expect(result).toEqual([]);
    });
  });
});
