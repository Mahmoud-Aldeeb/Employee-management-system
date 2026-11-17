import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import express, { type RequestHandler } from 'express';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

const helmetMiddleware =
  (helmet as unknown as { default?: () => RequestHandler }).default ??
  (helmet as unknown as () => RequestHandler);

export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService);

  app.use(helmetMiddleware());
  app.use(cookieParser());
  app.use(express.json());
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
