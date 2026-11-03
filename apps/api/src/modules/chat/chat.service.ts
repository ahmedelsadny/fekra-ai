import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface ChatMessageDto {
  id: string;
  roomSlug: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  content?: string;
  fileName?: string;
  fileType?: string;
  dataUrl?: string;
  createdAt: string;
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ensures a room exists for the organization (idempotent) */
  async ensureRoom(organizationId: string, slug: string, type: string, name: string) {
    return this.prisma.chatRoom.upsert({
      where: { organizationId_slug: { organizationId, slug } },
      update: {},
      create: { organizationId, slug, type: type || 'GROUP', name: name || slug },
    });
  }

  /** Message history for a room (oldest first, capped) */
  async listMessages(organizationId: string, slug: string, take = 100) {
    const room = await this.ensureRoom(organizationId, slug, 'GROUP', slug);
    const messages = await this.prisma.chatMessage.findMany({
      where: { roomId: room.id },
      include: { sender: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'asc' },
      take: Math.min(take, 200),
    });
    return messages.map((m) => this.toDto(m, slug));
  }

  /** Persists + returns a message DTO */
  async sendMessage(params: {
    organizationId: string;
    senderId: string;
    slug: string;
    type?: string;
    roomName?: string;
    content?: string;
    fileName?: string;
    fileType?: string;
    dataUrl?: string;
  }) {
    const room = await this.ensureRoom(
      params.organizationId,
      params.slug,
      params.type || 'GROUP',
      params.roomName || params.slug,
    );

    const message = await this.prisma.chatMessage.create({
      data: {
        roomId: room.id,
        senderId: params.senderId,
        content: params.content ?? null,
        fileName: params.fileName ?? null,
        fileType: params.fileType ?? null,
        dataUrl: params.dataUrl ?? null,
      },
      include: { sender: { select: { id: true, fullName: true, email: true } } },
    });

    return this.toDto(message, params.slug);
  }

  private toDto(
    message: {
      id: string;
      senderId: string;
      content?: string | null;
      fileName?: string | null;
      fileType?: string | null;
      dataUrl?: string | null;
      createdAt: Date;
      sender?: { fullName?: string } | null;
    },
    roomSlug: string,
  ): ChatMessageDto {
    const senderName = message.sender?.fullName || '';
    return {
      id: message.id,
      roomSlug,
      senderId: message.senderId,
      senderName,
      senderInitials: senderName
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
      content: message.content ?? undefined,
      fileName: message.fileName ?? undefined,
      fileType: message.fileType ?? undefined,
      dataUrl: message.dataUrl ?? undefined,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
