import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { Role } from '../common/enums/role.enum.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { CreatePayslipDto } from './dto/create-payslip.dto.js';
import { PayslipsService } from './payslips.service.js';

@ApiTags('Payslips')
@ApiCookieAuth()
@Controller('payslips')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayslipsController {
  constructor(private readonly payslips: PayslipsService) {}

  @Get()
  @ApiOperation({
    summary: 'Own payslips for employees, every payslip for admins',
  })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.payslips.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One payslip (owner or admin only)' })
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.payslips.findOne(id, user);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Generate a monthly payslip; amounts default to the current salary (admin)',
  })
  create(@Body() dto: CreatePayslipDto) {
    return this.payslips.create(dto);
  }
}
