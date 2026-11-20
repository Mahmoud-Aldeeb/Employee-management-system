import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { Role } from '../common/enums/role.enum.js';
import { isDemoEmail } from '../demo/demo.constants.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { UsersService } from '../users/users.service.js';
import { ACCESS_TTL_S, REFRESH_TTL_S } from './auth.constants.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

interface RefreshPayload extends JwtPayload {
  sid: string;
}

const DEMO_SESSION_LIMIT = 200;

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');
const refreshExpiry = () => new Date(Date.now() + REFRESH_TTL_S * 1000);

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly sessions: SessionsService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, userAgent?: string) {
    const user = await this.users.findByEmailWithPassword(dto.email);
    const valid = user
      ? await bcrypt.compare(dto.password, user.password)
      : false;
    if (!user || !valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (dto.role_type === 'admin' && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Not authorized as admin');
    }
    if (dto.role_type === 'employee' && user.role !== Role.EMPLOYEE) {
      throw new ForbiddenException('Not authorized as employee');
    }
    return this.openSession(
      { id: user.id, email: user.email, role: user.role },
      userAgent,
    );
  }

  async openSession(identity: JwtPayload, userAgent?: string) {
    const sid = randomUUID();
    const tokens = await this.signTokens(identity, sid);
    await this.sessions.create({
      sid,
      userId: identity.id,
      tokenHash: sha256(tokens.refreshToken),
      expiresAt: refreshExpiry(),
      userAgent,
      maxSessions: isDemoEmail(identity.email) ? DEMO_SESSION_LIMIT : undefined,
    });
    return { ...tokens, payload: identity };
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) throw new UnauthorizedException();

    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.sessions.findActive(payload.sid);
    const currentHash = sha256(refreshToken);
    if (
      !session ||
      String(session.userId) !== payload.id ||
      session.tokenHash !== currentHash
    ) {
      throw new UnauthorizedException();
    }

    const user = await this.users.findById(payload.id);
    if (!user) throw new UnauthorizedException();

    const identity = { id: user.id, email: user.email, role: user.role };
    const tokens = await this.signTokens(identity, payload.sid);
    const rotated = await this.sessions.rotate(
      payload.sid,
      currentHash,
      sha256(tokens.refreshToken),
      refreshExpiry(),
    );
    if (!rotated) throw new UnauthorizedException();

    return { ...tokens, payload: identity };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        ignoreExpiration: true,
      });
      if (typeof payload.sid === 'string')
        await this.sessions.revoke(payload.sid);
    } catch {
      return;
    }
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    userAgent?: string,
  ) {
    const user = await this.users.findByIdWithPassword(userId);
    if (!user) throw new NotFoundException('User not found');
    if (isDemoEmail(user.email)) {
      throw new ForbiddenException(
        'Demo accounts cannot change their password',
      );
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    await this.users.updatePassword(
      userId,
      await bcrypt.hash(dto.newPassword, 10),
    );
    await this.sessions.revokeAllForUser(userId);

    return this.openSession(
      { id: user.id, email: user.email, role: user.role },
      userAgent,
    );
  }

  private async signTokens(identity: JwtPayload, sid: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(identity, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: ACCESS_TTL_S,
      }),
      this.jwt.signAsync(
        { ...identity, sid },
        {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: REFRESH_TTL_S,
          jwtid: randomUUID(),
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(token: string) {
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      if (typeof payload.sid !== 'string') throw new UnauthorizedException();
      return payload;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
