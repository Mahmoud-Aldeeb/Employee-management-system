import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { createLoginRateLimiter } from './common/rate-limit/login-rate-limiter.js';

export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService);
  const httpServer = app.getHttpAdapter().getInstance() as {
    set: (setting: string, value: unknown) => void;
  };

  httpServer.set('trust proxy', 1);
  app.use(helmet());
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/auth/login', createLoginRateLimiter());
  app.enableCors({
    origin: config.getOrThrow<string>('CLIENT_URL'),
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
