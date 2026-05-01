import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForumEntity } from './entities/forum.entity';
import { ForumMemberEntity } from './entities/forum-member.entity';
import { ForumPostEntity } from './entities/forum-post.entity';
import { ForumVoteEntity } from './entities/forum-vote.entity';
import { ForumCommentVoteEntity } from './entities/forum-comment-vote.entity';
import { CommentEntity } from '../posts/entities/comment.entity';
import { CreateForumDto } from './dto/create-forum.dto';
import { UpdateForumDto } from './dto/update-forum.dto';
import { CreateForumPostDto } from './dto/create-forum-post.dto';

@Injectable()
export class ForumsService {
  constructor(
    @InjectRepository(ForumEntity) private forumRepo: Repository<ForumEntity>,
    @InjectRepository(ForumMemberEntity) private memberRepo: Repository<ForumMemberEntity>,
    @InjectRepository(ForumPostEntity) private postRepo: Repository<ForumPostEntity>,
    @InjectRepository(ForumVoteEntity) private voteRepo: Repository<ForumVoteEntity>,
    @InjectRepository(ForumCommentVoteEntity)
    private commentVoteRepo: Repository<ForumCommentVoteEntity>,
    @InjectRepository(CommentEntity) private commentRepo: Repository<CommentEntity>,
  ) {}

  async createForum(userId: string, dto: CreateForumDto) {
    const existing = await this.forumRepo.findOne({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug already in use');
    const forum = this.forumRepo.create({ ...dto, createdByUserId: userId });
    return this.forumRepo.save(forum);
  }

  async listForums(category?: string, userId?: string) {
    const where = category ? { category } : {};
    const forums = await this.forumRepo.find({ where, order: { memberCount: 'DESC' } });
    if (!userId) return forums.map((f) => ({ ...f, isMember: false }));

    const memberships = await this.memberRepo.find({ where: { userId } });
    const joined = new Set(memberships.map((m) => m.forumId));
    return forums.map((f) => ({ ...f, isMember: joined.has(f.id) }));
  }

  async getForumBySlug(slug: string, userId?: string) {
    const forum = await this.forumRepo.findOne({ where: { slug } });
    if (!forum) throw new NotFoundException('Forum not found');
    const isMember = userId
      ? !!(await this.memberRepo.findOne({ where: { forumId: forum.id, userId } }))
      : false;
    return { ...forum, isMember };
  }

  async updateForum(slug: string, userId: string, dto: UpdateForumDto) {
    const forum = await this.forumRepo.findOne({ where: { slug } });
    if (!forum) throw new NotFoundException('Forum not found');
    if (forum.createdByUserId !== userId) throw new ForbiddenException();
    Object.assign(forum, dto);
    return this.forumRepo.save(forum);
  }

  async deleteForum(slug: string, userId: string) {
    const forum = await this.forumRepo.findOne({ where: { slug } });
    if (!forum) throw new NotFoundException('Forum not found');
    if (forum.createdByUserId !== userId) throw new ForbiddenException();
    await this.forumRepo.remove(forum);
    return { deleted: true };
  }

  async joinForum(slug: string, userId: string) {
    const forum = await this.forumRepo.findOne({ where: { slug } });
    if (!forum) throw new NotFoundException('Forum not found');
    const existing = await this.memberRepo.findOne({ where: { forumId: forum.id, userId } });
    if (existing) return { joined: true };
    await this.memberRepo.save(this.memberRepo.create({ forumId: forum.id, userId }));
    forum.memberCount += 1;
    await this.forumRepo.save(forum);
    return { joined: true };
  }

  async leaveForum(slug: string, userId: string) {
    const forum = await this.forumRepo.findOne({ where: { slug } });
    if (!forum) return { left: true };
    const member = await this.memberRepo.findOne({ where: { forumId: forum.id, userId } });
    if (!member) return { left: true };
    await this.memberRepo.remove(member);
    forum.memberCount = Math.max(0, forum.memberCount - 1);
    await this.forumRepo.save(forum);
    return { left: true };
  }

  async createPost(slug: string, userId: string, dto: CreateForumPostDto) {
    const forum = await this.forumRepo.findOne({ where: { slug } });
    if (!forum) throw new NotFoundException('Forum not found');
    const post = this.postRepo.create({
      forumId: forum.id,
      userId,
      title: dto.title,
      content: dto.content,
      mediaUrls: dto.mediaUrls ?? [],
    });
    const saved = await this.postRepo.save(post);
    forum.postCount += 1;
    await this.forumRepo.save(forum);
    return saved;
  }

  async listPosts(slug: string, sort: 'hot' | 'top' | 'new', page: number, userId?: string) {
    const forum = await this.forumRepo.findOne({ where: { slug } });
    if (!forum) throw new NotFoundException('Forum not found');

    const limit = 20;
    const qb = this.postRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'user')
      .where('p.forumId = :forumId', { forumId: forum.id });

    if (sort === 'top') {
      qb.orderBy('p.voteScore', 'DESC');
    } else if (sort === 'new') {
      qb.orderBy('p.createdAt', 'DESC');
    } else {
      qb.orderBy('p.createdAt', 'DESC');
    }

    qb.skip((page - 1) * limit).take(limit);
    let posts = await qb.getMany();

    if (sort === 'hot') {
      const now = Date.now();
      posts = posts.sort((a, b) => {
        const ageA = (now - new Date(a.createdAt).getTime()) / 3600000;
        const ageB = (now - new Date(b.createdAt).getTime()) / 3600000;
        const scoreA = a.voteScore / Math.pow(ageA + 2, 1.5);
        const scoreB = b.voteScore / Math.pow(ageB + 2, 1.5);
        return scoreB - scoreA;
      });
    }

    if (!userId) return posts.map((p) => ({ ...p, myVote: null }));

    const votes = await this.voteRepo.find({ where: { userId } });
    const voteMap = new Map(votes.map((v) => [v.forumPostId, v.value]));
    return posts.map((p) => ({ ...p, myVote: voteMap.get(p.id) ?? null }));
  }

  async getPost(slug: string, postId: string, userId?: string) {
    const forum = await this.forumRepo.findOne({ where: { slug } });
    if (!forum) throw new NotFoundException('Forum not found');
    const post = await this.postRepo.findOne({
      where: { id: postId, forumId: forum.id },
      relations: ['user'],
    });
    if (!post) throw new NotFoundException('Post not found');
    const myVote = userId
      ? (await this.voteRepo.findOne({ where: { forumPostId: postId, userId } }))?.value ?? null
      : null;
    return { ...post, myVote };
  }

  async deletePost(slug: string, postId: string, userId: string) {
    const forum = await this.forumRepo.findOne({ where: { slug } });
    if (!forum) throw new NotFoundException('Forum not found');
    const post = await this.postRepo.findOne({ where: { id: postId, forumId: forum.id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException();
    await this.postRepo.remove(post);
    forum.postCount = Math.max(0, forum.postCount - 1);
    await this.forumRepo.save(forum);
    return { deleted: true };
  }

  async voteOnPost(slug: string, postId: string, userId: string, value: -1 | 1) {
    const forum = await this.forumRepo.findOne({ where: { slug } });
    if (!forum) throw new NotFoundException('Forum not found');
    const post = await this.postRepo.findOne({ where: { id: postId, forumId: forum.id } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.voteRepo.findOne({ where: { forumPostId: postId, userId } });
    if (existing) {
      const delta = value - existing.value;
      existing.value = value;
      await this.voteRepo.save(existing);
      post.voteScore += delta;
    } else {
      await this.voteRepo.save(this.voteRepo.create({ forumPostId: postId, userId, value }));
      post.voteScore += value;
    }
    return this.postRepo.save(post);
  }

  async removeVoteOnPost(slug: string, postId: string, userId: string) {
    const forum = await this.forumRepo.findOne({ where: { slug } });
    if (!forum) throw new NotFoundException('Forum not found');
    const post = await this.postRepo.findOne({ where: { id: postId, forumId: forum.id } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.voteRepo.findOne({ where: { forumPostId: postId, userId } });
    if (!existing) return { removed: false };
    post.voteScore -= existing.value;
    await this.voteRepo.remove(existing);
    await this.postRepo.save(post);
    return { removed: true };
  }

  async voteOnComment(commentId: string, userId: string, value: -1 | 1) {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    const existing = await this.commentVoteRepo.findOne({ where: { commentId, userId } });
    if (existing) {
      const delta = value - existing.value;
      existing.value = value;
      await this.commentVoteRepo.save(existing);
      comment.voteScore += delta;
    } else {
      await this.commentVoteRepo.save(
        this.commentVoteRepo.create({ commentId, userId, value }),
      );
      comment.voteScore += value;
    }
    return this.commentRepo.save(comment);
  }

  async removeVoteOnComment(commentId: string, userId: string) {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    const existing = await this.commentVoteRepo.findOne({ where: { commentId, userId } });
    if (!existing) return { removed: false };
    comment.voteScore -= existing.value;
    await this.commentVoteRepo.remove(existing);
    await this.commentRepo.save(comment);
    return { removed: true };
  }
}
