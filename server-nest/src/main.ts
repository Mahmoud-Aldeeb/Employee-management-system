import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { serve } from 'inngest/express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { InngestFunctionsService } from './inngest/inngest-functions.service.js';
import { InngestService } from './inngest/inngest.service.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);

  configureApp(app);

  const inngest = app.get(InngestService);
  const inngestFunctions = app.get(InngestFunctionsService);
  app.use(
    '/api/inngest',
    serve({
      client: inngest.client,
      functions: inngestFunctions.getFunctions(),
    }),
  );

  await app.listen(config.get<number>('PORT') ?? 4000);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start the API', error);
  process.exit(1);
});
