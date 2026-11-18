import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createLoginRateLimiter } from '../src/common/rate-limit/login-rate-limiter.js';

function buildApp(skip?: () => boolean) {
  const app = express();
  app.use(express.json());
  app.use('/login', createLoginRateLimiter(skip ? { skip } : {}));
  app.post('/login', (_request, response) => {
    response.json({ ok: true });
  });
  return app;
}

function attempt(app: ReturnType<typeof buildApp>, email: string) {
  return request(app).post('/login').send({ email, password: 'whatever' });
}

describe('login rate limiter', () => {
  it('allows five attempts per email and then answers 429', async () => {
    const app = buildApp(() => false);

    for (let index = 0; index < 5; index += 1) {
      expect((await attempt(app, 'ada@test.local')).status).toBe(200);
    }

    const blocked = await attempt(app, 'ada@test.local');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toContain('Too many login attempts');
  });

  it('counts the same email regardless of letter case', async () => {
    const app = buildApp(() => false);

    for (let index = 0; index < 5; index += 1) {
      await attempt(app, 'ada@test.local');
    }

    expect((await attempt(app, 'ADA@Test.Local')).status).toBe(429);
  });

  it('does not block other emails', async () => {
    const app = buildApp(() => false);

    for (let index = 0; index < 6; index += 1) {
      await attempt(app, 'ada@test.local');
    }

    expect((await attempt(app, 'sara@test.local')).status).toBe(200);
  });

  it('is switched off by default in the test environment', async () => {
    const app = buildApp();

    for (let index = 0; index < 8; index += 1) {
      expect((await attempt(app, 'ada@test.local')).status).toBe(200);
    }
  });
});
