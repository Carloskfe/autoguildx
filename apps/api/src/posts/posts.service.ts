import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from './entities/post.entity';

@Injectable()
export class PostsService {
  constructor(@InjectRepository(PostEntity) private repo: Repository<PostEntity>) {}

  async create(userId: string, dto: { content: string; mediaUrls?: string[] }) {
    const post = this.repo.create({ ...dto, userId });
    return this.repo.save(post);
  }

  async getFeed(page = 1, limit = 20) {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });
  }

  async getUserPosts(userId: string, page = 1, limit = 20) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async like(postId: string) {
    const post = await this.repo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    post.likesCount += 1;
    return this.repo.save(post);
  }

  async delete(postId: string, userId: string) {
    const post = await this.repo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException();
    await this.repo.remove(post);
    return { deleted: true };
  }
}
