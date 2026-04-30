import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';

export interface CreateNotificationDto {
  userId: string;
  actorId: string;
  type: string;
  targetId?: string;
  targetType?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(NotificationEntity) private repo: Repository<NotificationEntity>) {}

  async create(dto: CreateNotificationDto) {
    if (dto.userId === dto.actorId) return; // never notify yourself
    const notification = this.repo.create(dto);
    await this.repo.save(notification);
  }

  async getNotifications(userId: string, page = 1, limit = 20) {
    const p = Number.isFinite(page) ? page : 1;
    const l = Number.isFinite(limit) ? limit : 20;
    return this.repo.find({
      where: { userId },
      relations: ['actor', 'actor.profile'],
      order: { createdAt: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.repo.count({ where: { userId, isRead: false } });
    return { count };
  }

  async markRead(id: string, userId: string) {
    await this.repo.update({ id, userId }, { isRead: true });
    return { updated: true };
  }

  async markAllRead(userId: string) {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
    return { updated: true };
  }
}
