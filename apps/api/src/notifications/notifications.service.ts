import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { EmailService } from '../email/email.service';
import { templates } from '../email/email.templates';

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
  constructor(
    @InjectRepository(NotificationEntity) private repo: Repository<NotificationEntity>,
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateNotificationDto) {
    if (dto.userId === dto.actorId) return;
    const notification = this.repo.create(dto);
    await this.repo.save(notification);
    await this.sendEmail(dto);
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

  async getEmailSettings(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'emailNotificationsEnabled'],
    });
    return { emailNotificationsEnabled: user?.emailNotificationsEnabled ?? true };
  }

  async updateEmailSettings(userId: string, enabled: boolean) {
    await this.userRepo.update({ id: userId }, { emailNotificationsEnabled: enabled });
    return { emailNotificationsEnabled: enabled };
  }

  private async sendEmail(dto: CreateNotificationDto) {
    const EMAIL_TYPES = new Set([
      'verification_approved',
      'verification_denied',
      'new_message',
      'follow',
      'review',
    ]);
    if (!EMAIL_TYPES.has(dto.type)) return;

    const recipient = await this.userRepo.findOne({
      where: { id: dto.userId },
      select: ['id', 'email', 'emailNotificationsEnabled'],
    });
    if (!recipient?.email || recipient.emailNotificationsEnabled === false) return;

    let tpl: { subject: string; html: string } | null = null;

    if (dto.type === 'verification_approved') {
      tpl = templates.verificationApproved();
    } else if (dto.type === 'verification_denied') {
      tpl = templates.verificationDenied();
    } else if (dto.type === 'new_message') {
      const actor = await this.userRepo.findOne({
        where: { id: dto.actorId },
        relations: ['profile'],
      });
      const name = (actor as any)?.profile?.name ?? actor?.email ?? 'Someone';
      tpl = templates.newMessage(name);
    } else if (dto.type === 'follow') {
      const actor = await this.userRepo.findOne({
        where: { id: dto.actorId },
        relations: ['profile'],
      });
      const name = (actor as any)?.profile?.name ?? actor?.email ?? 'Someone';
      tpl = templates.newFollower(name);
    } else if (dto.type === 'review') {
      const actor = await this.userRepo.findOne({
        where: { id: dto.actorId },
        relations: ['profile'],
      });
      const name = (actor as any)?.profile?.name ?? actor?.email ?? 'Someone';
      const rating = (dto.data?.rating as number) ?? 5;
      tpl = templates.newReview(name, rating);
    }

    if (tpl) {
      await this.emailService.send({ to: recipient.email, ...tpl });
    }
  }
}
