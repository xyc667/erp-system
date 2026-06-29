import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

export interface WsNotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
}

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true },
  namespace: '/ws',
})
export class NotificationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const raw =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers.authorization as string)?.replace(/^Bearer\s+/i, '');
      if (!raw) throw new Error('missing token');
      const payload = this.jwtService.verify(raw) as {
        sub: string;
        tenantId: string;
      };
      client.data.userId = payload.sub;
      client.data.tenantId = payload.tenantId;
      await client.join(`user:${payload.sub}`);
      await client.join(`tenant:${payload.tenantId}`);
    } catch {
      this.logger.warn(`WS rejected: ${client.id}`);
      client.disconnect();
    }
  }

  pushNotification(
    tenantId: string,
    userId: string | null | undefined,
    notification: WsNotificationPayload,
  ) {
    if (userId) {
      this.server.to(`user:${userId}`).emit('notification', notification);
    }
    this.server.to(`tenant:${tenantId}`).emit('notification', notification);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() _body: unknown) {
    client.emit('pong', { ts: Date.now() });
  }
}
