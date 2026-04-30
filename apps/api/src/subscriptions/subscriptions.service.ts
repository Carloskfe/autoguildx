import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { SubscriptionEntity } from './entities/subscription.entity';
import { UserEntity } from '../auth/entities/user.entity';

@Injectable()
export class SubscriptionsService {
  private readonly stripe: InstanceType<typeof Stripe> | null;
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(SubscriptionEntity) private repo: Repository<SubscriptionEntity>,
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
  ) {
    this.stripe = process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2026-04-22.dahlia' as any,
        })
      : null;
    if (!this.stripe) {
      this.logger.warn('STRIPE_SECRET_KEY not set — Stripe features disabled');
    }
  }

  async getCurrent(userId: string) {
    const sub = await this.repo.findOne({
      where: { userId, active: true },
      order: { startDate: 'DESC' },
    });
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

  async createCheckoutSession(userId: string, tier: 'owner' | 'company') {
    const priceId =
      tier === 'owner' ? process.env.STRIPE_PRICE_OWNER : process.env.STRIPE_PRICE_COMPANY;

    if (!this.stripe) throw new BadRequestException('Stripe is not configured');
    if (!priceId) throw new BadRequestException('Stripe price ID not configured for this tier');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await this.userRepo.save(user);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/subscription/cancel`,
      metadata: { userId, tier },
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, sig: string) {
    if (!this.stripe) return { received: true };

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET not set — skipping webhook verification');
      return { received: true };
    }

    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const { userId, tier } = session.metadata ?? {};
      if (userId && (tier === 'owner' || tier === 'company')) {
        await this.upgrade(userId, tier);
        this.logger.log(`Upgraded user ${userId} to ${tier} via Stripe`);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      const customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;
      const user = await this.userRepo.findOne({ where: { stripeCustomerId: customerId } });
      if (user) {
        await this.cancel(user.id).catch(() => {});
        this.logger.log(`Downgraded user ${user.id} to free — Stripe subscription cancelled`);
      }
    }

    return { received: true };
  }
}
