import { Injectable, NotFoundException } from '@nestjs/common';
import { Equipment } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(roomId: string, dto: CreateEquipmentDto): Promise<Equipment> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room || !room.isActive) {
      throw new NotFoundException('Salle introuvable.');
    }
    return this.prisma.equipment.create({ data: { ...dto, roomId } });
  }

  async update(roomId: string, equipmentId: string, dto: UpdateEquipmentDto): Promise<Equipment> {
    await this.findInRoom(roomId, equipmentId);
    return this.prisma.equipment.update({ where: { id: equipmentId }, data: dto });
  }

  /** Désactivation logique : le matériel disparaît des listes, l'historique subsiste. */
  async deactivate(roomId: string, equipmentId: string): Promise<Equipment> {
    await this.findInRoom(roomId, equipmentId);
    return this.prisma.equipment.update({
      where: { id: equipmentId },
      data: { isActive: false },
    });
  }

  private async findInRoom(roomId: string, equipmentId: string): Promise<Equipment> {
    const equipment = await this.prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!equipment || equipment.roomId !== roomId) {
      throw new NotFoundException('Matériel introuvable dans cette salle.');
    }
    return equipment;
  }
}
