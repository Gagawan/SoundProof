import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BookingStatus, Role } from '@prisma/client';

import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from './bookings.service';

const member: AuthenticatedUser = { id: 'user-1', email: 'marie@soundproof.fr', role: Role.MEMBER };
const otherMember: AuthenticatedUser = {
  id: 'user-2',
  email: 'karim@soundproof.fr',
  role: Role.MEMBER,
};
const admin: AuthenticatedUser = { id: 'admin-1', email: 'admin@soundproof.fr', role: Role.ADMIN };

/** Date future alignée sur un pas de 30 minutes (UTC), à J+7. */
function futureSlot(hoursUtc: number, minutes: 0 | 30 = 0, dayOffset = 7): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(hoursUtc, minutes, 0, 0);
  return d;
}

describe('BookingsService', () => {
  let service: BookingsService;

  const txMock = {
    room: { findUnique: jest.fn() },
    booking: { findFirst: jest.fn(), create: jest.fn() },
    bookingEquipment: { findMany: jest.fn() },
  };

  const prismaMock = {
    $transaction: jest.fn((cb: (tx: typeof txMock) => unknown) => cb(txMock)),
    booking: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const activeRoom = {
    id: 'room-1',
    name: 'Studio A',
    isActive: true,
    equipments: [
      { id: 'eq-1', name: 'Ampli Marshall' },
      { id: 'eq-2', name: 'Micro SM58' },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [BookingsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = moduleRef.get(BookingsService);

    // Situation nominale par défaut : salle active, aucun conflit
    txMock.room.findUnique.mockResolvedValue(activeRoom);
    txMock.booking.findFirst.mockResolvedValue(null);
    txMock.bookingEquipment.findMany.mockResolvedValue([]);
    txMock.booking.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: 'booking-new', ...data }),
    );
  });

  describe('create — règle 1 : validité du créneau', () => {
    it('accepte un créneau valide (futur, aligné, durée correcte)', async () => {
      const result = await service.create(member, {
        roomId: activeRoom.id,
        startsAt: futureSlot(10),
        endsAt: futureSlot(12),
      });

      expect(result.id).toBe('booking-new');
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('refuse un début postérieur ou égal à la fin', async () => {
      await expect(
        service.create(member, {
          roomId: activeRoom.id,
          startsAt: futureSlot(12),
          endsAt: futureSlot(10),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuse un créneau dans le passé', async () => {
      await expect(
        service.create(member, {
          roomId: activeRoom.id,
          startsAt: futureSlot(10, 0, -7),
          endsAt: futureSlot(12, 0, -7),
        }),
      ).rejects.toMatchObject({ message: 'Le créneau doit être dans le futur.' });
    });

    it('refuse une durée inférieure à 30 minutes', async () => {
      const startsAt = futureSlot(10);
      const endsAt = new Date(startsAt.getTime() + 15 * 60 * 1000);

      await expect(
        service.create(member, { roomId: activeRoom.id, startsAt, endsAt }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuse une durée supérieure à 8 heures', async () => {
      await expect(
        service.create(member, {
          roomId: activeRoom.id,
          startsAt: futureSlot(8),
          endsAt: futureSlot(17), // 9 h
        }),
      ).rejects.toMatchObject({
        message: 'La durée maximale d’une réservation est de 8 heures.',
      });
    });

    it('refuse un horaire non aligné sur un pas de 30 minutes', async () => {
      const startsAt = futureSlot(10);
      startsAt.setUTCMinutes(15);

      await expect(
        service.create(member, { roomId: activeRoom.id, startsAt, endsAt: futureSlot(12) }),
      ).rejects.toMatchObject({
        message: 'Les horaires doivent être alignés sur des pas de 30 minutes.',
      });
    });

    it('refuse une salle inexistante ou désactivée (404)', async () => {
      txMock.room.findUnique.mockResolvedValue(null);

      await expect(
        service.create(member, {
          roomId: 'room-inconnue',
          startsAt: futureSlot(10),
          endsAt: futureSlot(12),
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create — règle 2 : anti-chevauchement salle (409)', () => {
    const overlapCases: Array<[string, Date, Date]> = [
      ['chevauchement exact', futureSlot(10), futureSlot(12)],
      ['chevauchement partiel (fin dans le créneau)', futureSlot(9), futureSlot(11)],
      ['chevauchement partiel (début dans le créneau)', futureSlot(11), futureSlot(13)],
      ['créneau englobant', futureSlot(9), futureSlot(13)],
      ['créneau englobé', futureSlot(10, 30), futureSlot(11, 30)],
    ];

    it.each(overlapCases)('refuse : %s', async (_label, startsAt, endsAt) => {
      // Un booking CONFIRMED existe déjà sur 10:00-12:00
      txMock.booking.findFirst.mockResolvedValue({ id: 'booking-existant' });

      await expect(
        service.create(member, { roomId: activeRoom.id, startsAt, endsAt }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(txMock.booking.create).not.toHaveBeenCalled();
    });

    it('la recherche de conflit ne cible que les réservations CONFIRMED (une annulée passe)', async () => {
      const startsAt = futureSlot(10);
      const endsAt = futureSlot(12);
      await service.create(member, { roomId: activeRoom.id, startsAt, endsAt });

      expect(txMock.booking.findFirst).toHaveBeenCalledWith({
        where: {
          roomId: activeRoom.id,
          status: BookingStatus.CONFIRMED,
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
      });
    });

    it('exécute vérification et insertion dans une transaction (conditions de course)', async () => {
      await service.create(member, {
        roomId: activeRoom.id,
        startsAt: futureSlot(10),
        endsAt: futureSlot(12),
      });

      // La vérification ET la création passent par le client transactionnel tx
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(txMock.booking.findFirst).toHaveBeenCalled();
      expect(txMock.booking.create).toHaveBeenCalled();
    });
  });

  describe('create — règle 3 : matériel', () => {
    it("refuse un matériel n'appartenant pas à la salle réservée (400)", async () => {
      await expect(
        service.create(member, {
          roomId: activeRoom.id,
          startsAt: futureSlot(10),
          endsAt: futureSlot(12),
          equipmentIds: ['eq-autre-salle'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuse un matériel déjà réservé sur un créneau chevauchant (409, nom cité)', async () => {
      txMock.bookingEquipment.findMany.mockResolvedValue([
        { equipmentId: 'eq-1', equipment: { name: 'Ampli Marshall' } },
      ]);

      await expect(
        service.create(member, {
          roomId: activeRoom.id,
          startsAt: futureSlot(10),
          endsAt: futureSlot(12),
          equipmentIds: ['eq-1'],
        }),
      ).rejects.toMatchObject({
        constructor: ConflictException,
        message: 'Matériel déjà réservé sur ce créneau : Ampli Marshall.',
      });
    });

    it('accepte du matériel de la salle libre sur le créneau', async () => {
      const result = await service.create(member, {
        roomId: activeRoom.id,
        startsAt: futureSlot(10),
        endsAt: futureSlot(12),
        equipmentIds: ['eq-1', 'eq-2'],
      });

      expect(result.id).toBe('booking-new');
      expect(txMock.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            equipments: { create: [{ equipmentId: 'eq-1' }, { equipmentId: 'eq-2' }] },
          }) as unknown,
        }),
      );
    });
  });

  describe('cancel — règle 4 : annulation', () => {
    const futureBooking = {
      id: 'booking-1',
      userId: member.id,
      status: BookingStatus.CONFIRMED,
      startsAt: futureSlot(10),
    };

    it('permet au propriétaire d’annuler une réservation future (statut CANCELLED)', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(futureBooking);
      prismaMock.booking.update.mockResolvedValue({
        ...futureBooking,
        status: BookingStatus.CANCELLED,
      });

      await service.cancel(member, futureBooking.id);

      expect(prismaMock.booking.update).toHaveBeenCalledWith({
        where: { id: futureBooking.id },
        data: { status: BookingStatus.CANCELLED },
      });
    });

    it('permet à un ADMIN d’annuler la réservation d’un autre membre', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(futureBooking);
      prismaMock.booking.update.mockResolvedValue({
        ...futureBooking,
        status: BookingStatus.CANCELLED,
      });

      await expect(service.cancel(admin, futureBooking.id)).resolves.toBeDefined();
    });

    it("interdit l'annulation par un autre membre (403)", async () => {
      prismaMock.booking.findUnique.mockResolvedValue(futureBooking);

      await expect(service.cancel(otherMember, futureBooking.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prismaMock.booking.update).not.toHaveBeenCalled();
    });

    it("interdit l'annulation d'une réservation passée", async () => {
      prismaMock.booking.findUnique.mockResolvedValue({
        ...futureBooking,
        startsAt: futureSlot(10, 0, -7),
      });

      await expect(service.cancel(member, futureBooking.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("interdit l'annulation d'une réservation déjà annulée", async () => {
      prismaMock.booking.findUnique.mockResolvedValue({
        ...futureBooking,
        status: BookingStatus.CANCELLED,
      });

      await expect(service.cancel(member, futureBooking.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('renvoie 404 pour une réservation introuvable', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(null);

      await expect(service.cancel(member, 'booking-inconnu')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('lectures', () => {
    it('findMine ne renvoie que les réservations de l’utilisateur', async () => {
      prismaMock.booking.findMany.mockResolvedValue([]);

      await service.findMine(member.id);

      expect(prismaMock.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: member.id } }),
      );
    });

    it('findAll (ADMIN) applique les filtres salle et période', async () => {
      prismaMock.booking.findMany.mockResolvedValue([]);
      const from = futureSlot(0);
      const to = futureSlot(23, 30);

      await service.findAll({ roomId: activeRoom.id, from, to });

      expect(prismaMock.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { roomId: activeRoom.id, endsAt: { gt: from }, startsAt: { lt: to } },
        }),
      );
    });
  });
});
