import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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
import { CreateWorkplaceDto } from './dto/create-workplace.dto.js';
import { UpdateWorkplaceDto } from './dto/update-workplace.dto.js';
import { WorkplacesService } from './workplaces.service.js';

@ApiTags('Work locations')
@ApiCookieAuth()
@Controller('workplaces')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class WorkplacesController {
  constructor(private readonly workplaces: WorkplacesService) {}

  @Get()
  @ApiOperation({ summary: 'List the work locations (admin)' })
  list(@CurrentUser() user: JwtPayload) {
    return this.workplaces.list(user);
  }

  @Post()
  @ApiOperation({ summary: 'Add a work location (admin)' })
  create(@Body() dto: CreateWorkplaceDto, @CurrentUser() actor: JwtPayload) {
    return this.workplaces.create(dto, actor);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edit, move or switch off a work location (admin)' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateWorkplaceDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.workplaces.update(id, dto, actor);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a work location (admin)' })
  remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.workplaces.remove(id, actor);
  }
}
