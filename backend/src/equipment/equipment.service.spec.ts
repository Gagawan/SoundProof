import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EquipmentCategory } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { EquipmentService } from './equipment.service';

describe('EquipmentService', () => {
  let service: EquipmentService;

  const prismaMock = {
    room: { findUnique: jest.fn() },
    equipment: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const room = { id: 'room-1', isActive: true };
  const equipment = {
    id: 'eq-1',
    name: 'Ampli Marshall',
    category: EquipmentCategory.AMPLIFIER,
    roomId: room.id,
    isActive: true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [EquipmentService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = moduleRef.get(EquipmentService);
  });

  it('create ajoute un matériel à une salle active', async () => {
    prismaMock.room.findUnique.mockResolvedValue(room);
    prismaMock.equipment.create.mockResolvedValue(equipment);

    const result = await service.create(room.id, {
      name: equipment.name,
      category: equipment.category,
    });

    expect(result).toEqual(equipment);
    expect(prismaMock.equipment.create).toHaveBeenCalledWith({
      data: { name: equipment.name, category: equipment.category, roomId: room.id },
    });
  });

  it('create renvoie 404 si la salle est inconnue ou désactivée', async () => {
    prismaMock.room.findUnique.mockResolvedValue(null);

    await expect(
      service.create('room-inconnue', { name: 'x', category: EquipmentCategory.OTHER }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update renvoie 404 si le matériel appartient à une autre salle', async () => {
    prismaMock.equipment.findUnique.mockResolvedValue({ ...equipment, roomId: 'autre-salle' });

    await expect(service.update(room.id, equipment.id, { name: 'y' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deactivate est une désactivation logique', async () => {
    prismaMock.equipment.findUnique.mockResolvedValue(equipment);
    prismaMock.equipment.update.mockResolvedValue({ ...equipment, isActive: false });

    await service.deactivate(room.id, equipment.id);

    expect(prismaMock.equipment.update).toHaveBeenCalledWith({
      where: { id: equipment.id },
      data: { isActive: false },
    });
  });
});
