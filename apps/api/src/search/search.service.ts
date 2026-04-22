import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ProfileEntity } from '../profiles/entities/profile.entity';
import { ListingEntity } from '../listings/entities/listing.entity';
import { EventEntity } from '../events/entities/event.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(ProfileEntity) private profileRepo: Repository<ProfileEntity>,
    @InjectRepository(ListingEntity) private listingRepo: Repository<ListingEntity>,
    @InjectRepository(EventEntity) private eventRepo: Repository<EventEntity>,
  ) {}

  async search(q: string, type?: 'profiles' | 'listings' | 'events') {
    const term = `%${q}%`;
    const results: Record<string, unknown[]> = {};

    if (!type || type === 'profiles') {
      results.profiles = await this.profileRepo.find({
        where: [{ name: ILike(term) }, { businessName: ILike(term) }, { location: ILike(term) }],
        take: 10,
      });
    }

    if (!type || type === 'listings') {
      results.listings = await this.listingRepo.find({
        where: [{ title: ILike(term) }, { category: ILike(term) }],
        take: 10,
      });
    }

    if (!type || type === 'events') {
      results.events = await this.eventRepo.find({
        where: [{ title: ILike(term) }, { location: ILike(term) }],
        take: 10,
      });
    }

    return results;
  }
}
