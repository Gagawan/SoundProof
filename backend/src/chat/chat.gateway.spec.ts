import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';

import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

type EmittedEvent = [string, { code: string; message: string }];

function makeClient(user = { id: 'user-1', email: 'marie@soundproof.fr', role: Role.MEMBER }) {
  return {
    data: { user },
    handshake: { auth: {} as { token?: string } },
    emit: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
  };
}

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  const chatServiceMock = {
    assertCanAccessRoom: jest.fn(),
    createMessage: jest.fn(),
  };

  const jwtMock = { verifyAsync: jest.fn() };
  const configMock = { getOrThrow: jest.fn().mockReturnValue('secret-de-test') };
  const serverEmit = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: ChatService, useValue: chatServiceMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    gateway = moduleRef.get(ChatGateway);
    // Serveur Socket.IO minimal : server.to(room).emit(...)
    gateway.server = { to: jest.fn().mockReturnValue({ emit: serverEmit }) } as never;
  });

  describe('handleConnection — authentification du handshake', () => {
    it('déconnecte un client sans token', async () => {
      const client = makeClient();

      await gateway.handleConnection(client as never);

      expect(client.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({ code: 'UNAUTHORIZED' }),
      );
      expect(client.disconnect).toHaveBeenCalledWith(true);
    });

    it('déconnecte un client avec un token invalide', async () => {
      const client = makeClient();
      client.handshake.auth.token = 'token-invalide';
      jwtMock.verifyAsync.mockRejectedValue(new Error('invalid'));

      await gateway.handleConnection(client as never);

      expect(client.disconnect).toHaveBeenCalledWith(true);
    });

    it('attache l’utilisateur au socket pour un token valide', async () => {
      const client = makeClient();
      client.handshake.auth.token = 'token-valide';
      jwtMock.verifyAsync.mockResolvedValue({
        sub: 'user-9',
        email: 'karim@soundproof.fr',
        role: Role.MEMBER,
      });

      await gateway.handleConnection(client as never);

      expect(client.data.user).toEqual({
        id: 'user-9',
        email: 'karim@soundproof.fr',
        role: Role.MEMBER,
      });
      expect(client.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('room:join', () => {
    it('rejoint la room Socket.IO si l’accès est autorisé', async () => {
      const client = makeClient();
      chatServiceMock.assertCanAccessRoom.mockResolvedValue(undefined);

      await gateway.handleJoin(client as never, { roomId: 'room-1' });

      expect(client.join).toHaveBeenCalledWith('room:room-1');
    });

    it('émet une erreur FORBIDDEN sans réservation sur la salle', async () => {
      const client = makeClient();
      chatServiceMock.assertCanAccessRoom.mockRejectedValue(new ForbiddenException());

      await gateway.handleJoin(client as never, { roomId: 'room-1' });

      expect(client.join).not.toHaveBeenCalled();
      const [event, payload] = client.emit.mock.calls[0] as EmittedEvent;
      expect(event).toBe('error');
      expect(payload.code).toBe('FORBIDDEN');
    });

    it('émet une erreur de validation sans roomId', async () => {
      const client = makeClient();

      await gateway.handleJoin(client as never, {});

      expect(client.join).not.toHaveBeenCalled();
      const [event, payload] = client.emit.mock.calls[0] as EmittedEvent;
      expect(event).toBe('error');
      expect(payload.code).toBe('VALIDATION');
    });
  });

  describe('room:leave', () => {
    it('quitte la room Socket.IO', async () => {
      const client = makeClient();

      await gateway.handleLeave(client as never, { roomId: 'room-1' });

      expect(client.leave).toHaveBeenCalledWith('room:room-1');
    });

    it('ignore un payload sans roomId', async () => {
      const client = makeClient();

      await gateway.handleLeave(client as never, {});

      expect(client.leave).not.toHaveBeenCalled();
    });

    it('ignore un payload absent', async () => {
      const client = makeClient();

      await gateway.handleLeave(client as never, undefined as never);

      expect(client.leave).not.toHaveBeenCalled();
    });
  });

  describe('message:send', () => {
    it('persiste puis diffuse le message à la room', async () => {
      const client = makeClient();
      const message = { id: 'msg-1', content: 'Salut !' };
      chatServiceMock.assertCanAccessRoom.mockResolvedValue(undefined);
      chatServiceMock.createMessage.mockResolvedValue(message);

      await gateway.handleMessage(client as never, { roomId: 'room-1', content: 'Salut !' });

      expect(chatServiceMock.createMessage).toHaveBeenCalledWith('user-1', 'room-1', 'Salut !');
      expect(serverEmit).toHaveBeenCalledWith('message:new', message);
    });

    it('émet une erreur pour un message rejeté (vide/trop long)', async () => {
      const client = makeClient();
      chatServiceMock.assertCanAccessRoom.mockResolvedValue(undefined);
      chatServiceMock.createMessage.mockRejectedValue(
        new Error('Le message ne peut pas être vide.'),
      );

      await gateway.handleMessage(client as never, { roomId: 'room-1', content: '   ' });

      expect(serverEmit).not.toHaveBeenCalled();
      const [event, payload] = client.emit.mock.calls[0] as EmittedEvent;
      expect(event).toBe('error');
      expect(payload.message).toBe('Le message ne peut pas être vide.');
    });

    it('émet une erreur de validation sans roomId ou content', async () => {
      const client = makeClient();

      await gateway.handleMessage(client as never, { roomId: 'room-1' });

      const [event, payload] = client.emit.mock.calls[0] as EmittedEvent;
      expect(event).toBe('error');
      expect(payload.code).toBe('VALIDATION');
    });

    it('émet une erreur de validation pour un payload absent', async () => {
      const client = makeClient();

      await gateway.handleMessage(client as never, undefined as never);

      const [event, payload] = client.emit.mock.calls[0] as EmittedEvent;
      expect(event).toBe('error');
      expect(payload.code).toBe('VALIDATION');
    });

    it('émet un message générique pour une erreur inattendue (non-Error)', async () => {
      const client = makeClient();
      chatServiceMock.assertCanAccessRoom.mockResolvedValue(undefined);
      chatServiceMock.createMessage.mockRejectedValue('panne');

      await gateway.handleMessage(client as never, { roomId: 'room-1', content: 'Salut' });

      const [event, payload] = client.emit.mock.calls[0] as EmittedEvent;
      expect(event).toBe('error');
      expect(payload.message).toBe('Le message n’a pas pu être envoyé.');
    });

    it('émet une erreur de validation pour un join sans payload', async () => {
      const client = makeClient();

      await gateway.handleJoin(client as never, undefined as never);

      const [event, payload] = client.emit.mock.calls[0] as EmittedEvent;
      expect(event).toBe('error');
      expect(payload.code).toBe('VALIDATION');
    });
  });
});
