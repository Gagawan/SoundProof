import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BookingStatus, Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ChatService, MESSAGE_MAX_LENGTH } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;

  const prismaMock = {
    booking: { findFirst: jest.fn() },
    message: { findMany: jest.fn(), create: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [ChatService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = moduleRef.get(ChatService);
  });

  describe('assertCanAccessRoom — règle § 4.5.5', () => {
    it('autorise un membre ayant une réservation CONFIRMED (passée ou future) sur la salle', async () => {
      prismaMock.booking.findFirst.mockResolvedValue({ id: 'booking-1' });

      await expect(
        service.assertCanAccessRoom('user-1', Role.MEMBER, 'room-1'),
      ).resolves.toBeUndefined();

      expect(prismaMock.booking.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', roomId: 'room-1', status: BookingStatus.CONFIRMED },
        select: { id: true },
      });
    });

    it('refuse un membre sans réservation sur la salle (403)', async () => {
      prismaMock.booking.findFirst.mockResolvedValue(null);

      await expect(
        service.assertCanAccessRoom('user-1', Role.MEMBER, 'room-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('autorise toujours un ADMIN, sans requête en base', async () => {
      await expect(
        service.assertCanAccessRoom('admin-1', Role.ADMIN, 'room-1'),
      ).resolves.toBeUndefined();

      expect(prismaMock.booking.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('createMessage', () => {
    it('rejette un message vide (ou uniquement des espaces)', async () => {
      await expect(service.createMessage('user-1', 'room-1', '   ')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prismaMock.message.create).not.toHaveBeenCalled();
    });

    it(`rejette un message de plus de ${MESSAGE_MAX_LENGTH} caractères`, async () => {
      const tooLong = 'a'.repeat(MESSAGE_MAX_LENGTH + 1);

      await expect(service.createMessage('user-1', 'room-1', tooLong)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('persiste un message valide (trimé) avec son auteur', async () => {
      const created = {
        id: 'msg-1',
        content: 'Salut !',
        user: { id: 'user-1', firstName: 'Marie', lastName: 'Dubois' },
      };
      prismaMock.message.create.mockResolvedValue(created);

      const result = await service.createMessage('user-1', 'room-1', '  Salut !  ');

      expect(result).toEqual(created);
      expect(prismaMock.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { userId: 'user-1', roomId: 'room-1', content: 'Salut !' },
        }),
      );
    });
  });

  describe('getMessages — pagination par cursor', () => {
    const makeMessages = (count: number) =>
      Array.from({ length: count }, (_, i) => ({ id: `msg-${i}`, content: `m${i}` }));

    it('renvoie une page et le cursor suivant quand il reste des messages', async () => {
      prismaMock.message.findMany.mockResolvedValue(makeMessages(21));

      const page = await service.getMessages('room-1');

      expect(page.messages).toHaveLength(20);
      expect(page.nextCursor).toBe('msg-19');
    });

    it("renvoie nextCursor null en fin d'historique", async () => {
      prismaMock.message.findMany.mockResolvedValue(makeMessages(5));

      const page = await service.getMessages('room-1');

      expect(page.messages).toHaveLength(5);
      expect(page.nextCursor).toBeNull();
    });

    it('applique le cursor fourni (skip du message pivot)', async () => {
      prismaMock.message.findMany.mockResolvedValue([]);

      await service.getMessages('room-1', 'msg-19');

      expect(prismaMock.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: { id: 'msg-19' }, skip: 1 }),
      );
    });
  });
});
