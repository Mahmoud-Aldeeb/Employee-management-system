import type { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

interface LoginRateLimiterOptions {
  skip?: () => boolean;
}

function loginKey(request: Request) {
  const email = (request.body as { email?: unknown } | undefined)?.email;

  if (typeof email === 'string' && email.trim().length > 0) {
    return `email:${email.trim().toLowerCase()}`;
  }

  return `ip:${ipKeyGenerator(request.ip ?? '')}`;
}

export function createLoginRateLimiter({
  skip = () => process.env.NODE_ENV === 'test',
}: LoginRateLimiterOptions = {}) {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit: MAX_ATTEMPTS,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: loginKey,
    skip,
    handler: (_request, response) => {
      response
        .status(429)
        .json({
          error: 'Too many login attempts. Please try again in a minute.',
        });
    },
  });
}
