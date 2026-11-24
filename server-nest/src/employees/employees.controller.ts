import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Role } from '../common/enums/role.enum.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { EmployeesService } from './employees.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';

@ApiTags('Employees')
@ApiCookieAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'List employees with their salary (admin)' })
  findAll(@Query() query: ListEmployeesQueryDto): Promise<object[]> {
    return this.employees.findAll(query.department);
  }
  @Post()
  @ApiOperation({
    summary: 'Create an employee and their login account (admin)',
  })
  async create(
    @Body() dto: CreateEmployeeDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    const employee = await this.employees.create(dto, actor);
    return { success: true, employee };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update an employee, their account or their salary (admin)',
  })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.employees.update(id, dto, actor);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate an employee (soft delete, admin)' })
  remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.employees.remove(id, actor);
  }
}
