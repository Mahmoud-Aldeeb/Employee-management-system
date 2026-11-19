import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ACCESS_TTL_S, AuthService, REFRESH_TTL_S } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

const SESSION_MARKER = 'session_active';

function userAgentOf(request: Request) {
  return request.get('user-agent')?.slice(0, 200);
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, payload } = await this.auth.login(
      dto,
      userAgentOf(req),
    );
    this.setAuthCookies(res, accessToken, refreshToken);
    return { user: payload };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, payload } = await this.auth.refresh(
      req.cookies?.refresh_token,
    );
    this.setAuthCookies(res, accessToken, refreshToken);
    return { user: payload };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.refresh_token);
    this.clearAuthCookies(res);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('session')
  session(@CurrentUser() user: JwtPayload) {
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(200)
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.auth.changePassword(
      user.id,
      dto,
      userAgentOf(req),
    );
    this.setAuthCookies(res, accessToken, refreshToken);
    return { success: true };
  }

  private get baseCookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
    };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie('access_token', accessToken, {
      ...this.baseCookieOptions,
      maxAge: ACCESS_TTL_S * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      ...this.baseCookieOptions,
      path: '/api/auth',
      maxAge: REFRESH_TTL_S * 1000,
    });
    res.cookie(SESSION_MARKER, '1', {
      ...this.baseCookieOptions,
      maxAge: REFRESH_TTL_S * 1000,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token', this.baseCookieOptions);
    res.clearCookie('refresh_token', {
      ...this.baseCookieOptions,
      path: '/api/auth',
    });
    res.clearCookie(SESSION_MARKER, this.baseCookieOptions);
  }
}
