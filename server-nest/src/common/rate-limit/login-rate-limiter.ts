import { createEmailRateLimiter } from './email-rate-limiter.js';

interface LoginRateLimiterOptions {
  skip?: () => boolean;
}

export function createLoginRateLimiter({ skip }: LoginRateLimiterOptions = {}) {
  return createEmailRateLimiter({
    windowMs: 60_000,
    limit: 5,
    message: 'Too many login attempts. Please try again in a minute.',
    skip,
  });
}
