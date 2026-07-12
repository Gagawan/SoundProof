import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { DefaultEventsMap, Server, Socket } from 'socket.io';

import { AuthenticatedUser, JwtPayload } from '../auth/types/authenticated-user';
import { ChatService } from './chat.service';

interface RoomPayload {
  roomId?: string;
}

interface SendMessagePayload {
  roomId?: string;
  content?: string;
}

/** Données attachées au socket après authentification du handshake. */
interface SocketData {
  user: AuthenticatedUser;
}

type AuthenticatedSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;

const roomChannel = (roomId: string): string => `room:${roomId}`;

/**
 * Gateway temps réel du chat (namespace /chat).
 * L'authentification se fait par le JWT d'accès passé dans `auth.token`
 * du handshake Socket.IO : toute connexion sans token valide est rejetée.
 */
@WebSocketGateway({ namespace: '/chat', cors: false })
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const token = (client.handshake.auth as { token?: string }).token;
    if (!token) {
      client.emit('error', { code: 'UNAUTHORIZED', message: 'Authentification requise.' });
      client.disconnect(true);
      return;
    }
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      this.logger.warn('Connexion WebSocket refusée : token invalide ou expiré');
      client.emit('error', { code: 'UNAUTHORIZED', message: 'Session expirée.' });
      client.disconnect(true);
    }
  }

  @SubscribeMessage('room:join')
  async handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: RoomPayload,
  ): Promise<void> {
    const { user } = client.data;
    if (!payload?.roomId) {
      client.emit('error', { code: 'VALIDATION', message: 'roomId requis.' });
      return;
    }
    try {
      await this.chatService.assertCanAccessRoom(user.id, user.role, payload.roomId);
      await client.join(roomChannel(payload.roomId));
    } catch {
      client.emit('error', {
        code: 'FORBIDDEN',
        message: 'Le chat est réservé aux membres ayant une réservation dans cette salle.',
      });
    }
  }

  @SubscribeMessage('room:leave')
  async handleLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: RoomPayload,
  ): Promise<void> {
    if (payload?.roomId) {
      await client.leave(roomChannel(payload.roomId));
    }
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SendMessagePayload,
  ): Promise<void> {
    const { user } = client.data;
    if (!payload?.roomId || typeof payload.content !== 'string') {
      client.emit('error', { code: 'VALIDATION', message: 'roomId et content requis.' });
      return;
    }
    try {
      await this.chatService.assertCanAccessRoom(user.id, user.role, payload.roomId);
      const message = await this.chatService.createMessage(
        user.id,
        payload.roomId,
        payload.content,
      );
      this.server.to(roomChannel(payload.roomId)).emit('message:new', message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Le message n’a pas pu être envoyé.';
      client.emit('error', { code: 'REJECTED', message });
    }
  }
}
