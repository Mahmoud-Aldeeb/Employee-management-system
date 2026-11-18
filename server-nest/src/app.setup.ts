import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import express, { type RequestHandler } from 'express';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { createLoginRateLimiter } from './common/rate-limit/login-rate-limiter.js';

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
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/auth/login', createLoginRateLimiter());
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
}
