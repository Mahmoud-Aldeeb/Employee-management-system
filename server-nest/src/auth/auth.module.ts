import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuditModule } from '../audit/audit.module.js';
import { InngestClientModule } from '../inngest/inngest-client.module.js';
import { SessionsModule } from '../sessions/sessions.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthCookies } from './auth-cookies.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PasswordResetService } from './password-reset.service.js';
import { PasswordTokensModule } from './password-tokens/password-tokens.module.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    UsersModule,
    SessionsModule,
    PassportModule,
    JwtModule.register({}),
    AuditModule,
    PasswordTokensModule,
    InngestClientModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthCookies, JwtStrategy, PasswordResetService],
  exports: [AuthService, AuthCookies],
})
export class AuthModule {}
