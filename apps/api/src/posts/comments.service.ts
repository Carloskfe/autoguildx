import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity } from './entities/comment.entity';
import { PostEntity } from './entities/post.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity) private commentRepo: Repository<CommentEntity>,
    @InjectRepository(PostEntity) private postRepo: Repository<PostEntity>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(postId: string, userId: string, dto: { content: string }) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const comment = this.commentRepo.create({ postId, userId, content: dto.content });
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

  async findByPost(postId: string, page = 1, limit = 20) {
    return this.commentRepo.find({
      where: { postId },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });
  }
}
