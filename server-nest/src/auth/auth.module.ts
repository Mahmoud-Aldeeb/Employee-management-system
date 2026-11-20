import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SessionsModule } from '../sessions/sessions.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthCookies } from './auth-cookies.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    UsersModule,
    SessionsModule,
    PassportModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthCookies, JwtStrategy],
  exports: [AuthService, AuthCookies],
})
export class AuthModule {}
