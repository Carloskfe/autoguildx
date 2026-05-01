import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
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

  async search(
    q: string,
    type?: 'profiles' | 'listings' | 'events',
    location?: string,
    tag?: string,
  ) {
    const term = `%${q}%`;
    const locTerm = location ? `%${location}%` : null;
    const results: Record<string, unknown[]> = {};

    if (!type || type === 'profiles') {
      const baseWhere: FindOptionsWhere<ProfileEntity>[] = [
        { name: ILike(term) },
        { businessName: ILike(term) },
        { location: ILike(term) },
      ];

      let profiles = await this.profileRepo.find({ where: baseWhere, take: 20 });

      if (locTerm) {
        profiles = profiles.filter((p) =>
          p.location?.toLowerCase().includes(location!.toLowerCase()),
        );
      }

      if (tag) {
        profiles = profiles.filter((p) =>
          p.tags?.some((t) => t.toLowerCase().includes(tag.toLowerCase())),
        );
      }

      results.profiles = profiles.slice(0, 10);
    }

    if (!type || type === 'listings') {
      const listingWhere: FindOptionsWhere<ListingEntity>[] = [
        { title: ILike(term) },
        { category: ILike(term) },
      ];
      let listings = await this.listingRepo.find({ where: listingWhere, take: 20 });

      if (locTerm) {
        listings = listings.filter((l) =>
          l.location?.toLowerCase().includes(location!.toLowerCase()),
        );
      }

      results.listings = listings.slice(0, 10);
    }

    if (!type || type === 'events') {
      const eventWhere: FindOptionsWhere<EventEntity>[] = [
        { title: ILike(term) },
        { location: ILike(term) },
      ];
      let events = await this.eventRepo.find({ where: eventWhere, take: 20 });

      if (locTerm) {
        events = events.filter((e) =>
          e.location?.toLowerCase().includes(location!.toLowerCase()),
        );
      }

      results.events = events.slice(0, 10);
    }

    return results;
  }
}
