import { createEmailRateLimiter } from './email-rate-limiter.js';

interface ForgotPasswordRateLimiterOptions {
  skip?: () => boolean;
}

export function createForgotPasswordRateLimiter({
  skip,
}: ForgotPasswordRateLimiterOptions = {}) {
  return createEmailRateLimiter({
    windowMs: 15 * 60_000,
    limit: 3,
    message: 'Too many requests. Please try again later.',
    skip,
  });
}
