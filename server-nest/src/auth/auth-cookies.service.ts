import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import {
  ACCESS_COOKIE,
  ACCESS_TTL_S,
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
  REFRESH_TTL_S,
  SESSION_MARKER_COOKIE,
} from './auth.constants.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthCookies {
  private readonly baseOptions: CookieOptions;

  constructor(config: ConfigService) {
    this.baseOptions = {
      httpOnly: true,
      secure: config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
    };
  }

  set(response: Response, tokens: AuthTokens) {
    response.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...this.baseOptions,
      maxAge: ACCESS_TTL_S * 1000,
    });
    response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...this.baseOptions,
      path: REFRESH_COOKIE_PATH,
      maxAge: REFRESH_TTL_S * 1000,
    });
    response.cookie(SESSION_MARKER_COOKIE, '1', {
      ...this.baseOptions,
      maxAge: REFRESH_TTL_S * 1000,
    });
  }

  clear(response: Response) {
    response.clearCookie(ACCESS_COOKIE, this.baseOptions);
    response.clearCookie(REFRESH_COOKIE, {
      ...this.baseOptions,
      path: REFRESH_COOKIE_PATH,
    });
    response.clearCookie(SESSION_MARKER_COOKIE, this.baseOptions);
  }
}
