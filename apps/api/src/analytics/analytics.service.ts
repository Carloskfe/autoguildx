import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PostHog } from 'posthog-node';

@Injectable()
export class AnalyticsService implements OnModuleDestroy {
  private readonly client: PostHog | null;
  private readonly logger = new Logger(AnalyticsService.name);

  constructor() {
    const key = process.env.POSTHOG_KEY;
    const host = process.env.POSTHOG_HOST || 'https://eu.i.posthog.com';
    if (key) {
      this.client = new PostHog(key, { host, flushAt: 20, flushInterval: 10000 });
    } else {
      this.client = null;
      this.logger.warn('POSTHOG_KEY not set — server-side analytics disabled');
    }
  }

  capture(distinctId: string, event: string, properties?: Record<string, unknown>) {
    if (!this.client) return;
    try {
      this.client.capture({ distinctId, event, properties });
    } catch {
      // Analytics must never throw or block application flow
    }
  }

  identify(distinctId: string, properties: Record<string, unknown>) {
    if (!this.client) return;
    try {
      this.client.identify({ distinctId, properties });
    } catch {}
  }

  async deletePerson(distinctId: string) {
    if (!this.client) return;
    try {
      // PostHog Node SDK v4+ supports person deletion
      await (this.client as any).deletePersons?.({ distinctId });
    } catch {
      this.logger.warn(`Failed to delete PostHog person for ${distinctId}`);
    }
  }

  async onModuleDestroy() {
    await this.client?.shutdown();
  }
}
