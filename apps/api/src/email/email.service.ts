import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string | undefined;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>('EMAIL_API_KEY');
    this.from = config.get<string>('EMAIL_FROM') ?? 'AutoGuildX <noreply@autoguildx.com>';
  }

  async send(options: SendEmailOptions): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn(
        `[email] No EMAIL_API_KEY — skipping send to ${options.to}: ${options.subject}`,
      );
      return;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [options.to],
          subject: options.subject,
          html: options.html,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`[email] Resend error ${res.status}: ${body}`);
      }
    } catch (err) {
      this.logger.error(`[email] Failed to send to ${options.to}`, err);
    }
  }
}
