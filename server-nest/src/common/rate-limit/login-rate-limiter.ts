import type { Request, RequestHandler, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

interface LoginRateLimiterOptions {
  skip?: () => boolean;
}

type RateLimitFactory = (options?: Record<string, unknown>) => RequestHandler;

function resolveRateLimit(): RateLimitFactory {
  if (typeof rateLimit === 'function') {
    return rateLimit as unknown as RateLimitFactory;
  }

  const mod = rateLimit as unknown as {
    default?: RateLimitFactory;
    rateLimit?: RateLimitFactory;
  };

  if (typeof mod.default === 'function') {
    return mod.default;
  }

  if (typeof mod.rateLimit === 'function') {
    return mod.rateLimit;
  }

  throw new TypeError('Unable to resolve express-rate-limit function');
}

const rateLimitMiddleware = resolveRateLimit();

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
  return rateLimitMiddleware({
    windowMs: WINDOW_MS,
    limit: MAX_ATTEMPTS,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: loginKey,
    skip,
    handler: (_request: Request, response: Response) => {
      response.status(429).json({
        error: 'Too many login attempts. Please try again in a minute.',
      });
    },
  });
}
