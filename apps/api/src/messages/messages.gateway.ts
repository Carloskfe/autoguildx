import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessageEntity } from './entities/message.entity';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' },
  namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // userId → Set of socketIds
  private userSockets = new Map<string, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      const payload = this.jwtService.verify<{ sub: string }>(token);
      const userId = payload.sub;
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      (client as any)._userId = userId;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any)._userId as string | undefined;
    if (!userId) return;
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) this.userSockets.delete(userId);
    }
  }

  notifyNewMessage(
    conversationId: string,
    participantAId: string,
    participantBId: string,
    message: MessageEntity,
  ) {
    const recipientId = message.senderId === participantAId ? participantBId : participantAId;
    this.emitToUser(recipientId, 'new_message', { conversationId, message });
    // Notify sender's other open sessions
    const senderSockets = this.userSockets.get(message.senderId);
    if (senderSockets) {
      for (const socketId of senderSockets) {
        if (socketId !== message.senderId) {
          this.server.to(socketId).emit('conversation_updated', { conversationId });
        }
      }
    }
  }

  notifyUnreadCount(userId: string, count: number) {
    this.emitToUser(userId, 'unread_count_changed', { count });
  }

  private emitToUser(userId: string, event: string, data: unknown) {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, data);
    }
  }
}
