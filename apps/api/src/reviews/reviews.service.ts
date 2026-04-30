import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewEntity } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(@InjectRepository(ReviewEntity) private repo: Repository<ReviewEntity>) {}

  async upsert(reviewerId: string, dto: CreateReviewDto) {
    if (dto.targetType === 'profile' && dto.targetId === reviewerId) {
      throw new ForbiddenException('Cannot review yourself');
    }

    const existing = await this.repo.findOne({
      where: { reviewerId, targetId: dto.targetId, targetType: dto.targetType },
    });

    if (existing) {
      Object.assign(existing, dto);
      return this.repo.save(existing);
    }

    return this.repo.save(this.repo.create({ reviewerId, ...dto }));
  }

  async getForTarget(targetId: string, targetType: string, page = 1, limit = 20) {
    const p = Number.isFinite(page) ? page : 1;
    const l = Number.isFinite(limit) ? limit : 20;

    const [reviews, total] = await this.repo.findAndCount({
      where: { targetId, targetType },
      relations: ['reviewer', 'reviewer.profile'],
      order: { createdAt: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });

    const avgRating =
      total > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10 : null;

    const distribution = [1, 2, 3, 4, 5].reduce(
      (acc, star) => {
        acc[star] = reviews.filter((r) => r.rating === star).length;
        return acc;
      },
      {} as Record<number, number>,
    );

    return { reviews, total, avgRating, distribution };
  }

  async getSummary(targetId: string, targetType: string) {
    const rows = await this.repo.find({ where: { targetId, targetType }, select: ['rating'] });
    if (!rows.length) return { avgRating: null, total: 0 };
    const avg = Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10) / 10;
    return { avgRating: avg, total: rows.length };
  }

  async deleteReview(id: string, reviewerId: string) {
    const review = await this.repo.findOne({ where: { id } });
    if (!review) return { deleted: false };
    if (review.reviewerId !== reviewerId) throw new ForbiddenException();
    await this.repo.remove(review);
    return { deleted: true };
  }
}
