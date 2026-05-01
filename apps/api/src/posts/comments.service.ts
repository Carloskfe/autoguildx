import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity } from './entities/comment.entity';
import { CommentReactionEntity } from './entities/comment-reaction.entity';
import { PostEntity } from './entities/post.entity';
import { ForumPostEntity } from '../forums/entities/forum-post.entity';
import { NotificationsService } from '../notifications/notifications.service';

const VALID_EMOJIS = ['fire', 'love', 'respect', 'wild', 'like'];

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity) private commentRepo: Repository<CommentEntity>,
    @InjectRepository(CommentReactionEntity)
    private reactionRepo: Repository<CommentReactionEntity>,
    @InjectRepository(PostEntity) private postRepo: Repository<PostEntity>,
    @InjectRepository(ForumPostEntity) private forumPostRepo: Repository<ForumPostEntity>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(
    postId: string | null,
    userId: string,
    dto: { content: string; parentId?: string },
    forumPostId?: string | null,
  ) {
    if (postId) {
      const post = await this.postRepo.findOne({ where: { id: postId } });
      if (!post) throw new NotFoundException('Post not found');

      const comment = this.commentRepo.create({
        postId,
        userId,
        content: dto.content,
        parentId: dto.parentId ?? null,
      });
      const saved = await this.commentRepo.save(comment);

      post.commentsCount += 1;
      await this.postRepo.save(post);

      this.notifications
        .create({
          userId: post.userId,
          actorId: userId,
          type: 'comment',
          targetId: postId,
          targetType: 'post',
          data: { excerpt: dto.content.slice(0, 80) },
        })
        .catch(() => {});

      return saved;
    }

    const forumPost = await this.forumPostRepo.findOne({ where: { id: forumPostId! } });
    if (!forumPost) throw new NotFoundException('Forum post not found');

    const comment = this.commentRepo.create({
      forumPostId: forumPostId!,
      userId,
      content: dto.content,
      parentId: dto.parentId ?? null,
    });
    const saved = await this.commentRepo.save(comment);

    forumPost.commentCount += 1;
    await this.forumPostRepo.save(forumPost);

    return saved;
  }

  async findByPost(postId: string, page = 1, limit = 20) {
    const all = await this.commentRepo.find({
      where: { postId },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });
    return this.buildTree(all);
  }

  async findByForumPost(forumPostId: string) {
    const all = await this.commentRepo.find({
      where: { forumPostId },
      order: { voteScore: 'DESC', createdAt: 'ASC' },
      relations: ['user'],
    });
    return this.buildTree(all);
  }

  private buildTree(flat: CommentEntity[]) {
    const roots: CommentEntity[] = [];
    const map = new Map<string, CommentEntity>();

    for (const c of flat) {
      c.replies = [];
      map.set(c.id, c);
    }

    for (const c of flat) {
      if (c.parentId && map.has(c.parentId)) {
        const parent = map.get(c.parentId)!;
        parent.replies.push(c);
      } else {
        roots.push(c);
      }
    }

    return roots;
  }

  async reactToComment(commentId: string, userId: string, emoji: string) {
    if (!VALID_EMOJIS.includes(emoji)) throw new NotFoundException('Invalid emoji');
    const existing = await this.reactionRepo.findOne({ where: { commentId, userId } });
    if (existing) {
      existing.emoji = emoji;
      return this.reactionRepo.save(existing);
    }
    const reaction = this.reactionRepo.create({ commentId, userId, emoji });
    return this.reactionRepo.save(reaction);
  }

  async unreactToComment(commentId: string, userId: string) {
    const existing = await this.reactionRepo.findOne({ where: { commentId, userId } });
    if (existing) await this.reactionRepo.remove(existing);
    return { removed: true };
  }

  async getCommentReactions(commentId: string) {
    const reactions = await this.reactionRepo.find({ where: { commentId } });
    const counts: Record<string, number> = {};
    for (const r of reactions) {
      counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
    }
    return { total: reactions.length, counts };
  }

  async getMyCommentReaction(commentId: string, userId: string) {
    return this.reactionRepo.findOne({ where: { commentId, userId } });
  }
}
