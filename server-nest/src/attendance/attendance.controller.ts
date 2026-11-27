import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { AttendanceService } from './attendance.service.js';
import { AttendanceQueryDto } from './dto/attendance-query.dto.js';
import { ClockDto } from './dto/clock.dto.js';

@ApiTags('Attendance')
@ApiCookieAuth()
@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Clock in, or clock out when already clocked in today; the device location is required to clock in when work locations are set',
  })
  clockInOut(@CurrentUser() user: JwtPayload, @Body() dto: ClockDto) {
    return this.attendance.clockInOut(user.id, dto.location);
  }

  @Get()
  @ApiOperation({ summary: 'Attendance history of the signed-in employee' })
  getHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.attendance.getHistory(user.id, query.limit ?? 30);
  }

  @Get('policy')
  @ApiOperation({
    summary: 'Whether the signed-in employee must share a location to clock in',
  })
  policy(@CurrentUser() user: JwtPayload) {
    return this.attendance.getPolicy(user.id);
  }
}
