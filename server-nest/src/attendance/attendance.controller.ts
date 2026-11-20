import {
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

@ApiTags('Attendance')
@ApiCookieAuth()
@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Clock in, or clock out when already clocked in today',
  })
  clockInOut(@CurrentUser() user: JwtPayload) {
    return this.attendance.clockInOut(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Attendance history of the signed-in employee' })
  getHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.attendance.getHistory(user.id, query.limit ?? 30);
  }
}
