import { Controller, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll(@Request() req: { user: { userId: string } }) {
    return this.notificationsService.findForUser(req.user.userId);
  }

  @Get('unread-count')
  countUnread(@Request() req: { user: { userId: string } }) {
    return this.notificationsService.countUnread(req.user.userId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Request() req: { user: { userId: string } }) {
    return this.notificationsService.markRead(id, req.user.userId);
  }

  @Patch('read-all')
  markAllRead(@Request() req: { user: { userId: string } }) {
    return this.notificationsService.markAllRead(req.user.userId);
  }
}
