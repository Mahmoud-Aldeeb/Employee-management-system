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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthCookies } from '../auth/auth-cookies.service.js';
import { AuthService } from '../auth/auth.service.js';
import { userAgentOf } from '../auth/request-user-agent.js';
import { DemoModeGuard } from './demo-mode.guard.js';
import { DemoService } from './demo.service.js';
import { DemoLoginDto } from './dto/demo-login.dto.js';

@ApiTags('Demo')
@Controller('demo')
export class DemoController {
  constructor(
    private readonly demo: DemoService,
    private readonly auth: AuthService,
    private readonly cookies: AuthCookies,
  ) {}

  @Get('status')
  @ApiOperation({
    summary: 'Tell the frontend whether demo mode is enabled (public)',
  })
  status() {
    return { enabled: this.demo.isEnabled() };
  }

  @Post('login')
  @HttpCode(200)
  @UseGuards(DemoModeGuard)
  @ApiOperation({
    summary: 'Open a session on a demo account (only when demo mode is on)',
  })
  async login(
    @Body() dto: DemoLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.demo.ensureSeeded();
    const account = await this.demo.findAccount(dto.role);
    const { payload, ...tokens } = await this.auth.openSession(
      account,
      userAgentOf(req),
    );
    this.cookies.set(res, tokens);
    return { user: payload };
  }
}
