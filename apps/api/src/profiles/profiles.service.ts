import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileEntity } from './entities/profile.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(ProfileEntity) private repo: Repository<ProfileEntity>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: string, dto: Partial<ProfileEntity>) {
    const existing = await this.repo.findOne({ where: { userId } });
    if (existing) throw new ConflictException('Profile already exists for this user');
    const profile = this.repo.create({ ...dto, userId });
    return this.repo.save(profile);
  }

  async findById(id: string) {
    const profile = await this.repo.findOne({ where: { id }, relations: ['user'] });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async findByUserId(userId: string) {
    const profile = await this.repo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async update(userId: string, dto: Partial<ProfileEntity>) {
    const profile = await this.findByUserId(userId);
    Object.assign(profile, dto);
    return this.repo.save(profile);
  }

  async follow(followerId: string, targetId: string) {
    const [follower, target] = await Promise.all([
      this.repo.findOne({ where: { userId: followerId }, relations: ['following'] }),
      this.repo.findOne({ where: { id: targetId } }),
    ]);
    if (!follower || !target) throw new NotFoundException('Profile not found');

    const alreadyFollowing = follower.following.some((p) => p.id === targetId);
    if (!alreadyFollowing) {
      follower.following.push(target);
      follower.followingCount += 1;
      target.followersCount += 1;
      await this.repo.save([follower, target]);
      this.notifications
        .create({
          userId: target.userId,
          actorId: followerId,
          type: 'follow',
          targetId: target.id,
          targetType: 'profile',
        })
        .catch(() => {});
    }
    return { followed: true };
  }

  async unfollow(followerId: string, targetId: string) {
    const follower = await this.repo.findOne({
      where: { userId: followerId },
      relations: ['following'],
    });
    const target = await this.repo.findOne({ where: { id: targetId } });
    if (!follower || !target) throw new NotFoundException('Profile not found');

    follower.following = follower.following.filter((p) => p.id !== targetId);
    follower.followingCount = Math.max(0, follower.followingCount - 1);
    target.followersCount = Math.max(0, target.followersCount - 1);
    await this.repo.save([follower, target]);
    return { unfollowed: true };
  }

  async getFollowing(userId: string): Promise<ProfileEntity[]> {
    const profile = await this.repo.findOne({ where: { userId }, relations: ['following'] });
    return profile?.following ?? [];
  }

  async getFollowingUserIds(userId: string): Promise<string[]> {
    const following = await this.getFollowing(userId);
    return following.map((p) => p.userId);
  }
}
