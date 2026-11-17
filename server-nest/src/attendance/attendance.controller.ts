import {
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { AttendanceService } from './attendance.service.js';
import { AttendanceQueryDto } from './dto/attendance-query.dto.js';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post()
  @HttpCode(200)
  clockInOut(@CurrentUser() user: JwtPayload) {
    return this.attendance.clockInOut(user.id);
  }

  @Get()
  getHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.attendance.getHistory(user.id, query.limit ?? 30);
  }
}
