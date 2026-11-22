import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy.js';
import { TeamCalendarQueryDto } from '../dto/team-calendar-query.dto.js';
import { TeamCalendarService } from './team-calendar.service.js';

@ApiTags('Leave')
@ApiCookieAuth()
@Controller('leave/calendar')
@UseGuards(JwtAuthGuard)
export class TeamCalendarController {
  constructor(private readonly calendar: TeamCalendarService) {}

  @Get()
  @ApiOperation({
    summary:
      'Team calendar of one month: admins see all leave, employees see their own and approved leave of their department (types hidden)',
  })
  getCalendar(
    @CurrentUser() user: JwtPayload,
    @Query() query: TeamCalendarQueryDto,
  ) {
    return this.calendar.getCalendar(user, query);
  }
}
