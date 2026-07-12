import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Equipment, Room } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

export type RoomWithEquipments = Room & { equipments: Equipment[] };

export interface OccupiedSlot {
  startsAt: Date;
  endsAt: Date;
}

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Salles actives avec leur matériel actif (liste des membres). */
  findAllActive(): Promise<RoomWithEquipments[]> {
    return this.prisma.room.findMany({
      where: { isActive: true },
      include: { equipments: { where: { isActive: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<RoomWithEquipments> {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { equipments: { where: { isActive: true } } },
    });
    if (!room || !room.isActive) {
      throw new NotFoundException('Salle introuvable.');
    }
    return room;
  }

  /** Créneaux occupés (réservations CONFIRMED chevauchant la période). */
  async getAvailability(roomId: string, from: Date, to: Date): Promise<OccupiedSlot[]> {
    if (from >= to) {
      throw new BadRequestException('La date de début doit précéder la date de fin.');
    }
    await this.findOne(roomId);

    return this.prisma.booking.findMany({
      where: {
        roomId,
        status: BookingStatus.CONFIRMED,
        startsAt: { lt: to },
        endsAt: { gt: from },
      },
      select: { startsAt: true, endsAt: true },
      orderBy: { startsAt: 'asc' },
    });
  }

  async create(dto: CreateRoomDto): Promise<Room> {
    const existing = await this.prisma.room.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('Une salle porte déjà ce nom.');
    }
    return this.prisma.room.create({ data: dto });
  }

  async update(id: string, dto: UpdateRoomDto): Promise<Room> {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) {
      throw new NotFoundException('Salle introuvable.');
    }
    if (dto.name && dto.name !== room.name) {
      const existing = await this.prisma.room.findUnique({ where: { name: dto.name } });
      if (existing) {
        throw new ConflictException('Une salle porte déjà ce nom.');
      }
    }
    return this.prisma.room.update({ where: { id }, data: dto });
  }

  /** Désactivation logique : la salle disparaît des listes, l'historique subsiste. */
  async deactivate(id: string): Promise<Room> {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) {
      throw new NotFoundException('Salle introuvable.');
    }
    return this.prisma.room.update({ where: { id }, data: { isActive: false } });
  }
}
