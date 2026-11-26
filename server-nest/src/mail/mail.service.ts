import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import { isDemoEmail } from '../demo/demo.constants.js';

export type MailKind = 'account' | 'reminder';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  kind: MailKind;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from?: string;
  private readonly demoMode: boolean;

  constructor(config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST'),
      port: config.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: config.get<string>('SMTP_USER'),
        pass: config.get<string>('SMTP_PASS'),
      },
    });
    this.from = config.get<string>('SENDER_EMAIL');
    this.demoMode = config.get<boolean>('DEMO_MODE') === true;
  }

  async send({ to, subject, html, kind }: MailOptions) {
    const skipReason = this.skipReason(to, kind);
    if (skipReason) {
      this.logger.warn(`Skipped email "${subject}" to ${to}: ${skipReason}`);
      return;
    }
    if (!this.from) throw new Error('SENDER_EMAIL is not configured');

    const info = await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      html,
    });
    this.logger.log(`Sent email "${subject}" to ${to} (${info.messageId})`);
  }

  private skipReason(to: string, kind: MailKind) {
    if (isDemoEmail(to)) return 'demo addresses never receive email';
    if (this.demoMode && kind === 'reminder') {
      return 'reminders are turned off in demo mode';
    }
    return null;
  }
}
