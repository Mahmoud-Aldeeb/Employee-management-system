import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum.js';
import { isDemoEmail } from '../demo/demo.constants.js';
import { InngestService } from '../inngest/inngest.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { UsersService } from '../users/users.service.js';
import { PasswordTokensService } from './password-tokens/password-tokens.service.js';

const INVALID_LINK = 'This link is invalid or has expired';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly users: UsersService,
    private readonly tokens: PasswordTokensService,
    private readonly sessions: SessionsService,
    private readonly inngest: InngestService,
  ) {}

  async requestReset(email: string) {
    try {
      await this.inngest.send('auth/password-reset.requested', { email });
    } catch (error) {
      this.logger.warn(`Failed to queue the password reset: ${String(error)}`);
    }

    return { success: true };
  }

  async completeSetup(token: string, newPassword: string) {
    const consumed = await this.tokens.consume(token);
    const user = consumed ? await this.users.findById(consumed.userId) : null;
    if (!user) throw new BadRequestException(INVALID_LINK);
    if (isDemoEmail(user.email)) {
      throw new ForbiddenException(
        'Demo accounts cannot change their password',
      );
    }

    await this.users.updatePassword(
      user.id,
      await bcrypt.hash(newPassword, 10),
    );
    await this.sessions.revokeAllForUser(user.id);
    await this.tokens.revokeAllForUser(user.id);

    const portal: 'admin' | 'employee' =
      user.role === Role.ADMIN ? 'admin' : 'employee';
    return { success: true, portal };
  }
}
