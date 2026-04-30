import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PostEntity } from './entities/post.entity';
import { PostReactionEntity } from './entities/post-reaction.entity';

export const VALID_REACTIONS = ['fire', 'love', 'respect', 'wild', 'like'] as const;

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity) private repo: Repository<PostEntity>,
    @InjectRepository(PostReactionEntity) private reactionRepo: Repository<PostReactionEntity>,
  ) {}

  async create(userId: string, dto: { content: string; mediaUrls?: string[]; visibility?: string }) {
    const post = this.repo.create({ ...dto, userId, visibility: dto.visibility ?? 'public' });
    return this.repo.save(post);
  }

  async getFeed(followingUserIds?: string[], page = 1, limit = 20) {
    const p = Number.isFinite(page) ? page : 1;
    const l = Number.isFinite(limit) ? limit : 20;

    const qb = this.repo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('post.sharedPost', 'sharedPost')
      .leftJoinAndSelect('sharedPost.user', 'sharedUser')
      .leftJoinAndSelect('sharedUser.profile', 'sharedProfile')
      .where('post.visibility = :pub', { pub: 'public' })
      .orderBy('post.createdAt', 'DESC')
      .skip((p - 1) * l)
      .take(l);

    if (followingUserIds?.length) {
      qb.andWhere('post.userId IN (:...ids)', { ids: followingUserIds });
    }

    return qb.getMany();
  }

  async getUserPosts(userId: string, page = 1, limit = 20) {
    const p = Number.isFinite(page) ? page : 1;
    const l = Number.isFinite(limit) ? limit : 20;
    return this.repo.find({
      where: [
        { userId, visibility: 'public' },
        { userId, visibility: 'followers' },
      ],
      order: { createdAt: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });
  }

  async like(postId: string) {
    const post = await this.repo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    post.likesCount += 1;
    return this.repo.save(post);
  }

  async react(postId: string, userId: string, emoji: string) {
    const post = await this.repo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.reactionRepo.findOne({ where: { postId, userId } });
    if (existing) {
      existing.emoji = emoji;
      return this.reactionRepo.save(existing);
    }
    return this.reactionRepo.save(this.reactionRepo.create({ postId, userId, emoji }));
  }

  async unreact(postId: string, userId: string) {
    const reaction = await this.reactionRepo.findOne({ where: { postId, userId } });
    if (reaction) await this.reactionRepo.remove(reaction);
    return { removed: true };
  }

  async getReactions(postId: string) {
    const reactions = await this.reactionRepo.find({ where: { postId } });
    const counts: Record<string, number> = {};
    for (const r of reactions) {
      counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
    }
    return { total: reactions.length, counts };
  }

  async getUserReaction(postId: string, userId: string) {
    return this.reactionRepo.findOne({ where: { postId, userId } });
  }

  async share(postId: string, userId: string, content?: string) {
    const original = await this.repo.findOne({ where: { id: postId } });
    if (!original) throw new NotFoundException('Post not found');
    if (original.visibility !== 'public') throw new ForbiddenException('Cannot share non-public posts');

    original.sharesCount += 1;
    await this.repo.save(original);

    const newPost = this.repo.create({
      userId,
      content: content ?? '',
      sharedPostId: postId,
      visibility: 'public',
    });
    return this.repo.save(newPost);
  }

  async delete(postId: string, userId: string) {
    const post = await this.repo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException();
    await this.repo.remove(post);
    return { deleted: true };
  }
}
