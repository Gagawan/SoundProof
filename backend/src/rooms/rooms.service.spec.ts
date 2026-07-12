import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BookingStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from './rooms.service';

describe('RoomsService', () => {
  let service: RoomsService;

  const prismaMock = {
    room: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    booking: { findMany: jest.fn() },
  };

  const room = {
    id: 'room-1',
    name: 'Studio A',
    description: 'Grande salle',
    capacity: 6,
    isActive: true,
    equipments: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [RoomsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = moduleRef.get(RoomsService);
  });

  it('findAllActive ne liste que les salles actives et leur matériel actif', async () => {
    prismaMock.room.findMany.mockResolvedValue([room]);

    const result = await service.findAllActive();

    expect(result).toEqual([room]);
    expect(prismaMock.room.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      include: { equipments: { where: { isActive: true } } },
      orderBy: { name: 'asc' },
    });
  });

  it('findOne renvoie 404 pour une salle désactivée', async () => {
    prismaMock.room.findUnique.mockResolvedValue({ ...room, isActive: false });

    await expect(service.findOne(room.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create refuse un nom de salle déjà pris', async () => {
    prismaMock.room.findUnique.mockResolvedValue(room);

    await expect(
      service.create({ name: 'Studio A', description: 'x', capacity: 4 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('findOne renvoie 404 pour une salle inconnue', async () => {
    prismaMock.room.findUnique.mockResolvedValue(null);

    await expect(service.findOne('room-inconnue')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create crée la salle quand le nom est libre', async () => {
    prismaMock.room.findUnique.mockResolvedValue(null);
    prismaMock.room.create.mockResolvedValue(room);

    const dto = { name: 'Studio A', description: 'Grande salle', capacity: 6 };
    const result = await service.create(dto);

    expect(result).toEqual(room);
    expect(prismaMock.room.create).toHaveBeenCalledWith({ data: dto });
  });

  it('update modifie une salle existante', async () => {
    prismaMock.room.findUnique.mockResolvedValue(room);
    prismaMock.room.update.mockResolvedValue({ ...room, capacity: 8 });

    const result = await service.update(room.id, { capacity: 8 });

    expect(result.capacity).toBe(8);
  });

  it('update renvoie 404 pour une salle inconnue', async () => {
    prismaMock.room.findUnique.mockResolvedValue(null);

    await expect(service.update('room-inconnue', { capacity: 8 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update refuse un nouveau nom déjà porté par une autre salle', async () => {
    prismaMock.room.findUnique
      .mockResolvedValueOnce(room) // la salle modifiée
      .mockResolvedValueOnce({ ...room, id: 'room-2' }); // une autre salle porte le nom

    await expect(service.update(room.id, { name: 'Studio B' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('update accepte de conserver le même nom', async () => {
    prismaMock.room.findUnique.mockResolvedValue(room);
    prismaMock.room.update.mockResolvedValue(room);

    await expect(service.update(room.id, { name: room.name })).resolves.toEqual(room);
    // Pas de requête d'unicité supplémentaire pour un nom inchangé
    expect(prismaMock.room.findUnique).toHaveBeenCalledTimes(1);
  });

  it('deactivate renvoie 404 pour une salle inconnue', async () => {
    prismaMock.room.findUnique.mockResolvedValue(null);

    await expect(service.deactivate('room-inconnue')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deactivate est une désactivation logique (pas de suppression)', async () => {
    prismaMock.room.findUnique.mockResolvedValue(room);
    prismaMock.room.update.mockResolvedValue({ ...room, isActive: false });

    await service.deactivate(room.id);

    expect(prismaMock.room.update).toHaveBeenCalledWith({
      where: { id: room.id },
      data: { isActive: false },
    });
  });

  describe('getAvailability', () => {
    it('renvoie les créneaux occupés (CONFIRMED chevauchant la période)', async () => {
      prismaMock.room.findUnique.mockResolvedValue(room);
      const slot = {
        startsAt: new Date('2026-09-01T10:00:00Z'),
        endsAt: new Date('2026-09-01T12:00:00Z'),
      };
      prismaMock.booking.findMany.mockResolvedValue([slot]);

      const from = new Date('2026-09-01T00:00:00Z');
      const to = new Date('2026-09-08T00:00:00Z');
      const result = await service.getAvailability(room.id, from, to);

      expect(result).toEqual([slot]);
      expect(prismaMock.booking.findMany).toHaveBeenCalledWith({
        where: {
          roomId: room.id,
          status: BookingStatus.CONFIRMED,
          startsAt: { lt: to },
          endsAt: { gt: from },
        },
        select: { startsAt: true, endsAt: true },
        orderBy: { startsAt: 'asc' },
      });
    });

    it('refuse une période incohérente (from ≥ to)', async () => {
      await expect(
        service.getAvailability(room.id, new Date('2026-09-08'), new Date('2026-09-01')),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
