import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import express, { type RequestHandler } from 'express';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { createLoginRateLimiter } from './common/rate-limit/login-rate-limiter.js';
import { createSecurityHeaders } from './common/security/security-headers.js';
import { setupSwagger } from './docs/setup-swagger.js';
import { createForgotPasswordRateLimiter } from './common/rate-limit/forgot-password-rate-limiter.js';

const helmetMiddleware =
  (
    helmet as unknown as {
      default?: (options?: Record<string, unknown>) => RequestHandler;
    }
  ).default ??
  (helmet as unknown as (options?: Record<string, unknown>) => RequestHandler);

export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService);
  const httpServer = app.getHttpAdapter().getInstance() as {
    set: (setting: string, value: unknown) => void;
  };

  const allowedOrigins = config
    .getOrThrow<string>('CLIENT_URL')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''));

  httpServer.set('trust proxy', 1);
  app.use(
    helmetMiddleware({
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(createSecurityHeaders());
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/auth/login', createLoginRateLimiter());
  app.use('/api/auth/forgot-password', createForgotPasswordRateLimiter());
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  setupSwagger(app);
}
