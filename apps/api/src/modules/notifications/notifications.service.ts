import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * Creates persistent notifications + pushes them live over Socket.IO.
   */
  async notifyUsers(
    organizationId: string,
    userIds: string[],
    data: { title: string; body: string; type?: NotificationType; referenceId?: string },
  ) {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (unique.length === 0) return;

    await this.prisma.notification.createMany({
      data: unique.map((userId) => ({
        organizationId,
        userId,
        title: data.title,
        body: data.body,
        type: data.type ?? NotificationType.SYSTEM,
        referenceId: data.referenceId ?? null,
      })),
    });

    this.chatGateway.emitNotification(organizationId, {
      userIds: unique,
      title: data.title,
      body: data.body,
    });
  }

  /** My notifications, most recent first */
  async listMine(userId: string, take = 50) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(take, 100),
    });
  }

  /** Marks all of my notifications as read */
  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
