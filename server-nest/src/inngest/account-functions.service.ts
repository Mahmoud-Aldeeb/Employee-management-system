import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { PasswordTokenPurpose } from '../auth/password-tokens/password-token-purpose.js';
import { PasswordTokensService } from '../auth/password-tokens/password-tokens.service.js';
import { buildAppUrl } from '../common/utils/app-url.js';
import { isDemoEmail } from '../demo/demo.constants.js';
import { Employee } from '../employees/schemas/employee.schema.js';
import { inviteEmail, passwordResetEmail } from '../mail/email-templates.js';
import { MailService } from '../mail/mail.service.js';
import { UsersService } from '../users/users.service.js';
import { InngestService } from './inngest.service.js';

const RESET_COOLDOWN_MS = 60_000;

export interface AccountTarget {
  userId: string;
  email: string;
  firstName: string;
}

@Injectable()
export class AccountFunctions {
  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<Employee>,
    private readonly inngest: InngestService,
    private readonly users: UsersService,
    private readonly tokens: PasswordTokensService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  getFunctions() {
    return [this.inviteRequested(), this.passwordResetRequested()];
  }

  async findResetTarget(email: string): Promise<AccountTarget | null> {
    const user = await this.users.findByEmail(email);
    if (!user || isDemoEmail(user.email)) return null;

    return this.targetOf(user);
  }

  isResetCoolingDown(userId: string) {
    return this.tokens.issuedWithin(
      userId,
      PasswordTokenPurpose.RESET,
      RESET_COOLDOWN_MS,
    );
  }

  async sendResetEmail(target: AccountTarget) {
    const token = await this.tokens.issue(
      target.userId,
      PasswordTokenPurpose.RESET,
    );
    const { subject, html } = passwordResetEmail({
      firstName: target.firstName,
      link: this.linkFor('/reset-password', token),
    });

    await this.mail.send({ to: target.email, subject, html });
  }

  async sendInvitation(userId: string) {
    const user = await this.users.findById(userId);
    if (!user?.invitedAt || isDemoEmail(user.email)) return false;

    const target = await this.targetOf(user);
    const token = await this.tokens.issue(userId, PasswordTokenPurpose.INVITE);
    const { subject, html } = inviteEmail({
      firstName: target.firstName,
      link: this.linkFor('/set-password', token),
    });

    await this.mail.send({ to: target.email, subject, html });
    return true;
  }

  private inviteRequested() {
    return this.inngest.client.createFunction(
      {
        id: 'invite-requested',
        triggers: [{ event: 'auth/invite.requested' }],
      },
      async ({ event, step }) => {
        const { userId } = event.data as { userId: string };

        const sent = await step.run('send-invitation', () =>
          this.sendInvitation(userId),
        );

        return { sent };
      },
    );
  }

  private passwordResetRequested() {
    return this.inngest.client.createFunction(
      {
        id: 'password-reset-requested',
        triggers: [{ event: 'auth/password-reset.requested' }],
      },
      async ({ event, step }) => {
        const { email } = event.data as { email: string };

        const target = await step.run('find-account', () =>
          this.findResetTarget(email),
        );
        if (!target) return { sent: false };

        const cooling = await step.run('check-cooldown', () =>
          this.isResetCoolingDown(target.userId),
        );
        if (cooling) return { sent: false };

        await step.run('send-reset-email', () => this.sendResetEmail(target));

        return { sent: true };
      },
    );
  }

  private async targetOf(user: {
    id: string;
    email: string;
  }): Promise<AccountTarget> {
    const employee = await this.employeeModel
      .findOne({ userId: user.id })
      .select('firstName')
      .lean()
      .exec();

    return {
      userId: user.id,
      email: user.email,
      firstName: employee?.firstName ?? 'there',
    };
  }

  private linkFor(path: string, token: string) {
    const base = buildAppUrl(
      this.config.getOrThrow<string>('CLIENT_URL'),
      path,
    );
    return `${base}#token=${encodeURIComponent(token)}`;
  }
}
