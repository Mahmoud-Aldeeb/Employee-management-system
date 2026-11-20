import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createSecurityHeaders } from '../src/common/security/security-headers.js';

function buildApp() {
  const app = express();
  app.use(createSecurityHeaders());
  app.get('/api/docs', (_request, response) => response.send('docs'));
  app.get('/api/health', (_request, response) => response.json({ ok: true }));
  return app;
}

describe('security headers', () => {
  it('allows the Swagger UI CDN scripts only on the docs routes', async () => {
    const app = buildApp();

    const docs = await request(app).get('/api/docs');
    const api = await request(app).get('/api/health');

    expect(docs.headers['content-security-policy']).toContain(
      'https://cdnjs.cloudflare.com',
    );
    expect(api.headers['content-security-policy']).not.toContain(
      'cdnjs.cloudflare.com',
    );
  });

  it('keeps the standard hardening headers on every route', async () => {
    const res = await request(buildApp()).get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain(
      "default-src 'self'",
    );
  });
});
