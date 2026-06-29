import { Injectable, OnModuleInit } from '@nestjs/common';
import { TenantService } from '../../common/tenant/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ErpEvent, QueueService } from '../queue/queue.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
    private tenant: TenantService,
    private gateway: NotificationsGateway,
  ) {}

  onModuleInit() {
    void this.queue.subscribe((event) => this.handleEvent(event));
  }

  private async handleEvent(event: ErpEvent) {
    if (!event.tenantId) return;
    const notification = await this.prisma.notification.create({
      data: {
        tenantId: event.tenantId,
        userId: event.userId ?? null,
        type: event.type,
        title: event.title,
        message: event.message,
      },
    });
    this.gateway.pushNotification(event.tenantId, event.userId, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt.toISOString(),
    });
  }

  findForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        ...this.tenant.where(),
        OR: [{ userId }, { userId: null }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false, ...this.tenant.where() },
      data: { read: true },
    });
  }

  countUnread(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false, ...this.tenant.where() },
    });
  }
}
