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
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { Role } from '../common/enums/role.enum.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { CreateLeaveDto } from './dto/create-leave.dto.js';
import { ListLeavesQueryDto } from './dto/list-leaves-query.dto.js';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto.js';
import { LeaveService } from './leave.service.js';

@Controller('leave')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveController {
  constructor(private readonly leave: LeaveService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateLeaveDto) {
    return this.leave.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListLeavesQueryDto) {
    return this.leave.findAll(user, query.status);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateLeaveStatusDto,
  ) {
    return this.leave.updateStatus(id, dto.status);
  }
}
