import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
    @InjectDataSource() private dataSource: DataSource,
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

  async deleteUser(targetId: string, requestingAdminId: string) {
    if (targetId === requestingAdminId) {
      throw new ForbiddenException('Cannot delete your own account');
    }
    const user = await this.userRepo.findOne({ where: { id: targetId } });
    if (!user) throw new NotFoundException('User not found');

    const q = this.dataSource.manager.query.bind(this.dataSource.manager);

    // forum_posts has a ManyToOne → UserEntity FK (RESTRICT by default) — must go first
    await q(`DELETE FROM "forum_posts" WHERE "userId" = $1`, [targetId]);
    // Tables with plain varchar userId (no FK constraint) — clean up orphaned data
    await q(`DELETE FROM "forum_members" WHERE "userId" = $1`, [targetId]);
    await q(`DELETE FROM "notifications" WHERE "userId" = $1`, [targetId]);
    await q(`DELETE FROM "post_reactions" WHERE "userId" = $1`, [targetId]);
    await q(`DELETE FROM "reviews" WHERE "reviewerId" = $1`, [targetId]);
    await q(
      `DELETE FROM "messages" WHERE "senderId" = $1 OR "conversationId" IN (
        SELECT id FROM "conversations" WHERE "participantAId" = $1 OR "participantBId" = $1
      )`,
      [targetId],
    );
    await q(`DELETE FROM "conversations" WHERE "participantAId" = $1 OR "participantBId" = $1`, [
      targetId,
    ]);
    await q(`DELETE FROM "enrollments" WHERE "userId" = $1`, [targetId]);
    await q(`DELETE FROM "lesson_progress" WHERE "userId" = $1`, [targetId]);
    await q(`DELETE FROM "certificates" WHERE "userId" = $1`, [targetId]);
    await q(`DELETE FROM "verification_requests" WHERE "userId" = $1`, [targetId]);

    // CASCADE handles: profiles, posts → comments, listings, events, subscriptions
    await this.userRepo.delete(targetId);
  }
}
