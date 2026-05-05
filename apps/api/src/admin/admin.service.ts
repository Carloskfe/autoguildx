import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../auth/entities/user.entity';
import { ProfileEntity } from '../profiles/entities/profile.entity';
import { ListingEntity } from '../listings/entities/listing.entity';
import { EventEntity } from '../events/entities/event.entity';
import { PostEntity } from '../posts/entities/post.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    @InjectRepository(ProfileEntity) private profileRepo: Repository<ProfileEntity>,
    @InjectRepository(ListingEntity) private listingRepo: Repository<ListingEntity>,
    @InjectRepository(EventEntity) private eventRepo: Repository<EventEntity>,
    @InjectRepository(PostEntity) private postRepo: Repository<PostEntity>,
  ) {}

  async getStats() {
    const [users, profiles, listings, events, posts] = await Promise.all([
      this.userRepo.count(),
      this.profileRepo.count(),
      this.listingRepo.count(),
      this.eventRepo.count(),
      this.postRepo.count(),
    ]);
    return { users, profiles, listings, events, posts };
  }

  async getUsers(page = 1, limit = 20) {
    const [items, total] = await this.userRepo.findAndCount({
      select: ['id', 'email', 'role', 'provider', 'createdAt'],
      relations: ['profile'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async setUserRole(userId: string, role: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.role = role;
    await this.userRepo.save(user);
    return { id: user.id, email: user.email, role: user.role };
  }
}
