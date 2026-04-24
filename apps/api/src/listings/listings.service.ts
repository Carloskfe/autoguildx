import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { SUBSCRIPTION_LIMITS, SubscriptionTier } from '@autoguildx/shared';
import { ListingEntity } from './entities/listing.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(ListingEntity) private repo: Repository<ListingEntity>,
    private readonly subsService: SubscriptionsService,
  ) {}

  async create(userId: string, dto: Partial<ListingEntity>) {
    const sub = await this.subsService.getCurrent(userId);
    const tier = sub.tier as SubscriptionTier;
    const maxListings = SUBSCRIPTION_LIMITS[tier].maxListings;

    if (maxListings !== Infinity) {
      const current = await this.repo.count({ where: { userId, status: 'active' } });
      if (current >= maxListings) {
        throw new ForbiddenException(
          `Listing limit reached for your subscription tier (${maxListings} max). Upgrade to add more.`,
        );
      }
    }

    const listing = this.repo.create({ ...dto, userId });
    return this.repo.save(listing);
  }

  async findAll(query: {
    type?: string;
    category?: string;
    location?: string;
    q?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, category, location, q, page = 1, limit = 20 } = query;
    const where: Record<string, unknown> = { status: 'active' };
    if (type) where.type = type;
    if (category) where.category = category;
    if (location) where.location = ILike(`%${location}%`);
    if (q) where.title = ILike(`%${q}%`);

    return this.repo.find({
      where,
      order: { isFeatured: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findById(id: string) {
    const listing = await this.repo.findOne({ where: { id }, relations: ['user'] });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async update(id: string, userId: string, dto: Partial<ListingEntity>) {
    const listing = await this.repo.findOne({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.userId !== userId) throw new ForbiddenException();
    Object.assign(listing, dto);
    return this.repo.save(listing);
  }

  async delete(id: string, userId: string) {
    const listing = await this.repo.findOne({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.userId !== userId) throw new ForbiddenException();
    await this.repo.remove(listing);
    return { deleted: true };
  }

  async featureListing(id: string, userId: string, daysCount: number) {
    const listing = await this.repo.findOne({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.userId !== userId) throw new ForbiddenException();

    const sub = await this.subsService.getCurrent(userId);
    const tier = sub.tier as SubscriptionTier;
    const campaignLimit = SUBSCRIPTION_LIMITS[tier].featuredCampaigns;

    if (campaignLimit === 0) {
      throw new ForbiddenException(
        'Featured listings are not available on your subscription tier. Upgrade to boost a listing.',
      );
    }

    const activeFeatured = await this.repo.count({ where: { userId, isFeatured: true } });
    if (activeFeatured >= campaignLimit) {
      throw new ForbiddenException(
        `Featured campaign limit reached for your subscription tier (${campaignLimit} max).`,
      );
    }

    listing.isFeatured = true;
    listing.featuredUntil = new Date(Date.now() + daysCount * 86400000);
    return this.repo.save(listing);
  }
}
