import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { Role } from '../common/enums/role.enum.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { CreatePayslipDto } from './dto/create-payslip.dto.js';
import { PayslipsService } from './payslips.service.js';

@Controller('payslips')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayslipsController {
  constructor(private readonly payslips: PayslipsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.payslips.findAll(user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.payslips.findOne(id, user);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreatePayslipDto) {
    return this.payslips.create(dto);
  }
}
