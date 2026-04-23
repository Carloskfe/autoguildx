import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ListingEntity } from './entities/listing.entity';

@Injectable()
export class ListingsService {
  constructor(@InjectRepository(ListingEntity) private repo: Repository<ListingEntity>) {}

  async create(userId: string, dto: Partial<ListingEntity>) {
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

  async featureListing(id: string, daysCount: number) {
    const listing = await this.repo.findOne({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    listing.isFeatured = true;
    listing.featuredUntil = new Date(Date.now() + daysCount * 86400000);
    return this.repo.save(listing);
  }
}
