import {
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto.js';
import type { NotificationPage } from './notification.types.js';
import { NotificationsService } from './notifications.service.js';

@ApiTags('Notifications')
@ApiCookieAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Your notifications, newest first, with your unread count',
  })
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<NotificationPage> {
    return this.notifications.list(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'How many notifications you have not read yet' })
  unreadCount(@CurrentUser() user: JwtPayload) {
    return this.notifications.unreadCount(user.id);
  }

  @Post('read-all')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark all your notifications as read' })
  readAll(@CurrentUser() user: JwtPayload) {
    return this.notifications.markAllRead(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one of your notifications as read' })
  markRead(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notifications.markRead(user.id, id);
  }
}
