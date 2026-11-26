import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createForgotPasswordRateLimiter } from '../src/common/rate-limit/forgot-password-rate-limiter.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(createForgotPasswordRateLimiter({ skip: () => false }));
  app.post('/', (_request, response) => {
    response.json({ ok: true });
  });
  return app;
}

describe('forgot password rate limiter', () => {
  it('allows three requests per email and then answers 429', async () => {
    const app = buildApp();
    const send = (email: string) => request(app).post('/').send({ email });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect((await send('a@test.local')).status).toBe(200);
    }

    const blocked = await send('A@test.local');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe(
      'Too many requests. Please try again later.',
    );
    expect((await send('b@test.local')).status).toBe(200);
  });
});
