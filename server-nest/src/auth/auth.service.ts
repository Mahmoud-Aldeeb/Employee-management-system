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
import { UsersService } from '../users/users.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

export const ACCESS_TTL_S = 15 * 60;
export const REFRESH_TTL_S = 7 * 24 * 60 * 60;

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
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
    return this.issueTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) throw new UnauthorizedException();
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException();
    }
    const user = await this.users.findByIdWithRefreshHash(payload.id);
    if (
      !user?.refreshTokenHash ||
      user.refreshTokenHash !== sha256(refreshToken)
    ) {
      throw new UnauthorizedException();
    }
    return this.issueTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      await this.users.setRefreshTokenHash(payload.id, null);
    } catch {
      // invalid or expired token: nothing to revoke
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.users.findByIdWithPassword(userId);
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    await this.users.updatePassword(
      userId,
      await bcrypt.hash(dto.newPassword, 10),
    );
    return this.issueTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  private async issueTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: ACCESS_TTL_S,
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: REFRESH_TTL_S,
        jwtid: randomUUID(),
      }),
    ]);
    await this.users.setRefreshTokenHash(payload.id, sha256(refreshToken));
    return { accessToken, refreshToken, payload };
  }
}
