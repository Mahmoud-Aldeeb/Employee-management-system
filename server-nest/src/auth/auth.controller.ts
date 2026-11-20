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
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthCookies } from './auth-cookies.service.js';
import { REFRESH_COOKIE } from './auth.constants.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { userAgentOf } from './request-user-agent.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookies,
  ) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in and receive the session cookies' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { payload, ...tokens } = await this.auth.login(dto, userAgentOf(req));
    this.cookies.set(res, tokens);
    return { user: payload };
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate the refresh token and issue new cookies' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { payload, ...tokens } = await this.auth.refresh(
      req.cookies?.[REFRESH_COOKIE],
    );
    this.cookies.set(res, tokens);
    return { user: payload };
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'End the session of the current device' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    this.cookies.clear(res);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @Get('session')
  @ApiOperation({ summary: 'Return the signed-in user' })
  session(@CurrentUser() user: JwtPayload) {
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @Post('change-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Change the password and sign out every other device',
  })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { payload, ...tokens } = await this.auth.changePassword(
      user.id,
      dto,
      userAgentOf(req),
    );
    void payload;
    this.cookies.set(res, tokens);
    return { success: true };
  }
}
