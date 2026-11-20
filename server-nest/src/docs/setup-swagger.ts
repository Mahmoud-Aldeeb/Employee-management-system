import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DOCS_ROUTE, SWAGGER_UI_BASE_URL } from './docs.constants.js';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Employee Management System API')
    .setDescription(
      'REST API for employees, attendance, leave, payslips and analytics. ' +
        'Authentication uses httpOnly cookies: call POST /api/auth/login (or POST /api/demo/login ' +
        'when demo mode is on) and the browser keeps the session for the other requests.',
    )
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(DOCS_ROUTE, app, document, {
    customSiteTitle: 'EMS API Docs',
    customCssUrl: `${SWAGGER_UI_BASE_URL}/swagger-ui.min.css`,
    customJs: [
      `${SWAGGER_UI_BASE_URL}/swagger-ui-bundle.min.js`,
      `${SWAGGER_UI_BASE_URL}/swagger-ui-standalone-preset.min.js`,
    ],
    swaggerOptions: { persistAuthorization: true },
  });
}
