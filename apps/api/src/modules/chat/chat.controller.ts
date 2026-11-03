import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

export class SendChatMessageDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(4000)
  content?: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsString()
  @IsOptional()
  fileType?: string;

  /** small data-url attachment (limit enforced on the client too) */
  @IsString()
  @IsOptional()
  dataUrl?: string;
}

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('rooms/:slug/messages')
  @ApiOperation({ summary: 'Message history for a chat room (oldest first)' })
  async listMessages(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Query('take') take?: string,
  ) {
    return this.chatService.listMessages(user.orgId, slug, take ? Number(take) : 100);
  }

  @Post('rooms/:slug/messages')
  @ApiOperation({ summary: 'Send a message to a chat room (REST fallback — also broadcasts live)' })
  async sendMessage(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Body() body: SendChatMessageDto,
  ) {
    const dto = await this.chatService.sendMessage({
      organizationId: user.orgId,
      senderId: user.id,
      slug,
      type: body.type,
      roomName: body.name,
      content: body.content,
      fileName: body.fileName,
      fileType: body.fileType,
      dataUrl: body.dataUrl,
    });

    // Broadcast to everyone listening on this room (REST fallback path)
    this.chatGateway.emitChatMessage(user.orgId, slug, dto);
    return dto;
  }
}
