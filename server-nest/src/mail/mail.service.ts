import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
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

  async send({ to, subject, html }: MailOptions) {
    if (this.demoMode) {
      this.logger.log(`Demo mode: skipped email "${subject}" to ${to}`);
      return;
    }
    await this.transporter.sendMail({ from: this.from, to, subject, html });
  }
}
