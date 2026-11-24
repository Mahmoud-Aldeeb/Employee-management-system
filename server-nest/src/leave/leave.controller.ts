import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { Role } from '../common/enums/role.enum.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { CreateLeaveDto } from './dto/create-leave.dto.js';
import { LeaveBalanceQueryDto } from './dto/leave-balance-query.dto.js';
import { ListLeavesQueryDto } from './dto/list-leaves-query.dto.js';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto.js';
import { LeaveService } from './leave.service.js';

@ApiTags('Leave')
@ApiCookieAuth()
@Controller('leave')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveController {
  constructor(private readonly leave: LeaveService) {}

  @Post()
  @ApiOperation({
    summary:
      'Request a leave; the Egyptian leave policy is enforced (employee)',
  })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateLeaveDto) {
    return this.leave.create(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Own leaves for employees, every leave for admins, with working days',
  })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListLeavesQueryDto) {
    return this.leave.findAll(user, query.status);
  }

  @Get('balance')
  @ApiOperation({
    summary: 'Leave balance of the signed-in employee for a year (employee)',
  })
  balance(
    @CurrentUser() user: JwtPayload,
    @Query() query: LeaveBalanceQueryDto,
  ) {
    return this.leave.getBalance(user.id, query.year);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Approve, reject or reopen a leave request (admin)',
  })
  updateStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateLeaveStatusDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.leave.updateStatus(id, dto.status, actor);
  }
}
