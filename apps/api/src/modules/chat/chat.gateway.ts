import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

interface SocketUser {
  id: string;
  fullName: string;
  orgId: string;
}

/**
 * Real-time gateway (Socket.IO):
 * - JWT-authenticated handshake (token via `auth.token`)
 * - Everyone joins `org:<orgId>` (for live notifications)
 * - `chat:join` joins a chat room, `chat:send` persists + broadcasts
 * - `emitNotification` is used by other services to push live notifications
 */
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'fekra-ai-jwt-secret-key-2026',
      });
      const orgId: string | undefined = payload.memberships?.[0]?.orgId;
      client.data.user = {
        id: payload.sub,
        fullName: payload.fullName,
        orgId: orgId || '',
      } as SocketUser;
      if (orgId) client.join(`org:${orgId}`);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect() {
    // socket.io handles room cleanup automatically
  }

  @SubscribeMessage('chat:join')
  async onChatJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { slug: string; type?: string; name?: string },
  ) {
    const user = client.data.user as SocketUser;
    if (!user?.orgId || !body?.slug) return;
    await this.chatService.ensureRoom(user.orgId, body.slug, body.type || 'GROUP', body.name || body.slug);
    client.join(this.roomKey(user.orgId, body.slug));
  }

  @SubscribeMessage('chat:send')
  async onChatSend(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      slug: string;
      type?: string;
      name?: string;
      content?: string;
      fileName?: string;
      fileType?: string;
      dataUrl?: string;
    },
  ) {
    const user = client.data.user as SocketUser;
    if (!user?.orgId || !body?.slug) return;

    const dto = await this.chatService.sendMessage({
      organizationId: user.orgId,
      senderId: user.id,
      slug: body.slug,
      type: body.type,
      roomName: body.name,
      content: body.content,
      fileName: body.fileName,
      fileType: body.fileType,
      dataUrl: body.dataUrl,
    });

    // Broadcast to everyone in the room (including sender's other devices)
    this.server.to(this.roomKey(user.orgId, body.slug)).emit('chat:new', dto);
    return dto; // ack payload for the sender
  }

  /** Used by other services to push live notifications to the whole org */
  emitNotification(
    orgId: string,
    payload: { userIds: string[]; title: string; body: string },
  ) {
    this.server.to(`org:${orgId}`).emit('notif:new', payload);
  }

  /** Broadcast a persisted chat message to a room (used by the REST fallback) */
  emitChatMessage(orgId: string, slug: string, dto: unknown) {
    this.server.to(this.roomKey(orgId, slug)).emit('chat:new', dto as never);
  }

  private roomKey(orgId: string, slug: string) {
    return `chat:${orgId}:${slug}`;
  }
}
