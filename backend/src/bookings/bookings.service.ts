import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Booking, BookingStatus, Prisma, Role } from '@prisma/client';

import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsQueryDto } from './dto/list-bookings-query.dto';

const SLOT_STEP_MINUTES = 30;
const MIN_DURATION_MS = 30 * 60 * 1000; // 30 min
const MAX_DURATION_MS = 8 * 60 * 60 * 1000; // 8 h

/** Inclusion standard d'une réservation renvoyée à l'app. */
const BOOKING_INCLUDE = {
  room: { select: { id: true, name: true } },
  user: { select: { id: true, firstName: true, lastName: true } },
  equipments: {
    include: { equipment: { select: { id: true, name: true, category: true } } },
  },
} satisfies Prisma.BookingInclude;

export type BookingWithDetails = Prisma.BookingGetPayload<{ include: typeof BOOKING_INCLUDE }>;

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Création d'une réservation — règles § 4.5 de l'architecture :
   * validité du créneau, anti-chevauchement salle et matériel, le tout
   * dans une transaction Prisma pour éviter les conditions de course.
   */
  async create(user: AuthenticatedUser, dto: CreateBookingDto): Promise<BookingWithDetails> {
    this.assertValidSlot(dto.startsAt, dto.endsAt);
    const equipmentIds = dto.equipmentIds ?? [];

    return this.prisma.$transaction(async (tx) => {
      // La salle doit exister et être active
      const room = await tx.room.findUnique({
        where: { id: dto.roomId },
        include: { equipments: { where: { isActive: true }, select: { id: true, name: true } } },
      });
      if (!room || !room.isActive) {
        throw new NotFoundException('Salle introuvable.');
      }

      // Règle 2 — anti-chevauchement salle (réservations CONFIRMED uniquement)
      const roomConflict = await tx.booking.findFirst({
        where: {
          roomId: dto.roomId,
          status: BookingStatus.CONFIRMED,
          startsAt: { lt: dto.endsAt },
          endsAt: { gt: dto.startsAt },
        },
      });
      if (roomConflict) {
        throw new ConflictException('Ce créneau est déjà réservé pour cette salle.');
      }

      if (equipmentIds.length > 0) {
        // Règle 3a — le matériel doit appartenir à la salle réservée (et être actif)
        const roomEquipmentIds = new Set(room.equipments.map((e) => e.id));
        const foreign = equipmentIds.filter((id) => !roomEquipmentIds.has(id));
        if (foreign.length > 0) {
          throw new BadRequestException(
            'Un matériel demandé n’appartient pas à la salle réservée.',
          );
        }

        // Règle 3b — anti-chevauchement matériel
        const equipmentConflicts = await tx.bookingEquipment.findMany({
          where: {
            equipmentId: { in: equipmentIds },
            booking: {
              status: BookingStatus.CONFIRMED,
              startsAt: { lt: dto.endsAt },
              endsAt: { gt: dto.startsAt },
            },
          },
          include: { equipment: { select: { name: true } } },
        });
        if (equipmentConflicts.length > 0) {
          const names = [...new Set(equipmentConflicts.map((c) => c.equipment.name))].join(', ');
          throw new ConflictException(`Matériel déjà réservé sur ce créneau : ${names}.`);
        }
      }

      return tx.booking.create({
        data: {
          userId: user.id,
          roomId: dto.roomId,
          startsAt: dto.startsAt,
          endsAt: dto.endsAt,
          equipments: {
            create: equipmentIds.map((equipmentId) => ({ equipmentId })),
          },
        },
        include: BOOKING_INCLUDE,
      });
    });
  }

  /** Réservations de l'utilisateur connecté (récentes en premier). */
  findMine(userId: string): Promise<BookingWithDetails[]> {
    return this.prisma.booking.findMany({
      where: { userId },
      include: BOOKING_INCLUDE,
      orderBy: { startsAt: 'desc' },
    });
  }

  /** Toutes les réservations (ADMIN), filtrables par salle et période. */
  findAll(query: ListBookingsQueryDto): Promise<BookingWithDetails[]> {
    return this.prisma.booking.findMany({
      where: {
        roomId: query.roomId,
        ...(query.from && { endsAt: { gt: query.from } }),
        ...(query.to && { startsAt: { lt: query.to } }),
      },
      include: BOOKING_INCLUDE,
      orderBy: { startsAt: 'desc' },
    });
  }

  /**
   * Règle 4 — annulation : par le propriétaire ou un ADMIN, uniquement si la
   * réservation est à venir ; statut CANCELLED (pas de suppression, traçabilité).
   */
  async cancel(user: AuthenticatedUser, bookingId: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Réservation introuvable.');
    }
    if (booking.userId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Vous ne pouvez pas annuler la réservation d’un autre membre.');
    }
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cette réservation est déjà annulée.');
    }
    if (booking.startsAt.getTime() <= Date.now()) {
      throw new BadRequestException('Une réservation passée ou en cours ne peut pas être annulée.');
    }
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });
  }

  /** Règle 1 — validité du créneau. */
  private assertValidSlot(startsAt: Date, endsAt: Date): void {
    if (startsAt.getTime() >= endsAt.getTime()) {
      throw new BadRequestException('Le début du créneau doit précéder sa fin.');
    }
    if (startsAt.getTime() <= Date.now()) {
      throw new BadRequestException('Le créneau doit être dans le futur.');
    }
    const duration = endsAt.getTime() - startsAt.getTime();
    if (duration < MIN_DURATION_MS) {
      throw new BadRequestException('La durée minimale d’une réservation est de 30 minutes.');
    }
    if (duration > MAX_DURATION_MS) {
      throw new BadRequestException('La durée maximale d’une réservation est de 8 heures.');
    }
    if (!this.isAligned(startsAt) || !this.isAligned(endsAt)) {
      throw new BadRequestException('Les horaires doivent être alignés sur des pas de 30 minutes.');
    }
  }

  private isAligned(date: Date): boolean {
    return (
      date.getUTCMinutes() % SLOT_STEP_MINUTES === 0 &&
      date.getUTCSeconds() === 0 &&
      date.getUTCMilliseconds() === 0
    );
  }
}
