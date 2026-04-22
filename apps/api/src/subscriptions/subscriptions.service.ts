import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionEntity } from './entities/subscription.entity';

@Injectable()
export class SubscriptionsService {
  constructor(@InjectRepository(SubscriptionEntity) private repo: Repository<SubscriptionEntity>) {}

  async getCurrent(userId: string) {
    const sub = await this.repo.findOne({ where: { userId, active: true }, order: { startDate: 'DESC' } });
    return sub || { tier: 'free', active: true };
  }

  async upgrade(userId: string, tier: 'owner' | 'company') {
    const existing = await this.repo.findOne({ where: { userId, active: true } });
    if (existing) {
      existing.active = false;
      await this.repo.save(existing);
    }
    const sub = this.repo.create({ userId, tier, active: true });
    return this.repo.save(sub);
  }

  async cancel(userId: string) {
    const sub = await this.repo.findOne({ where: { userId, active: true } });
    if (!sub) throw new NotFoundException('No active subscription');
    sub.active = false;
    sub.endDate = new Date();
    return this.repo.save(sub);
  }
}
