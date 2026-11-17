import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { EmployeesService } from '../employees/employees.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  async getProfile(@CurrentUser() user: JwtPayload) {
    const employee = await this.employees.findByUserId(user.id);
    if (!employee) {
      return { firstName: 'Admin', lastName: '', email: user.email };
    }
    return employee;
  }

  @Post()
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.employees.updateBio(user.id, dto.bio ?? '');
  }
}
