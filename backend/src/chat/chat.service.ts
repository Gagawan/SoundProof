import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { BookingStatus, Prisma, Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export const MESSAGE_MAX_LENGTH = 1000;
const HISTORY_PAGE_SIZE = 20;

const MESSAGE_INCLUDE = {
  user: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.MessageInclude;

export type MessageWithAuthor = Prisma.MessageGetPayload<{ include: typeof MESSAGE_INCLUDE }>;

export interface MessagesPage {
  messages: MessageWithAuthor[];
  /** Cursor à passer pour charger la page suivante (null = fin de l'historique). */
  nextCursor: string | null;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Règle d'accès au chat (§ 4.5.5) : au moins une réservation CONFIRMED
   * (passée ou future) sur la salle, ou rôle ADMIN.
   */
  async assertCanAccessRoom(userId: string, role: Role, roomId: string): Promise<void> {
    if (role === Role.ADMIN) {
      return;
    }
    const booking = await this.prisma.booking.findFirst({
      where: { userId, roomId, status: BookingStatus.CONFIRMED },
      select: { id: true },
    });
    if (!booking) {
      // A09 — journalisation des refus d'accès
      this.logger.warn(`Accès chat refusé — utilisateur ${userId}, salle ${roomId}`);
      throw new ForbiddenException(
        'Le chat est réservé aux membres ayant une réservation dans cette salle.',
      );
    }
  }

  /** Historique paginé par cursor (du plus récent au plus ancien). */
  async getMessages(roomId: string, cursor?: string): Promise<MessagesPage> {
    const messages = await this.prisma.message.findMany({
      where: { roomId },
      include: MESSAGE_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: HISTORY_PAGE_SIZE + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = messages.length > HISTORY_PAGE_SIZE;
    const page = hasMore ? messages.slice(0, HISTORY_PAGE_SIZE) : messages;
    return {
      messages: page,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  /** Valide, persiste et retourne le message avec son auteur. */
  async createMessage(userId: string, roomId: string, content: string): Promise<MessageWithAuthor> {
    const trimmed = content.trim();
    if (trimmed.length === 0) {
      throw new BadRequestException('Le message ne peut pas être vide.');
    }
    if (trimmed.length > MESSAGE_MAX_LENGTH) {
      throw new BadRequestException(
        `Le message ne peut pas dépasser ${MESSAGE_MAX_LENGTH} caractères.`,
      );
    }
    return this.prisma.message.create({
      data: { userId, roomId, content: trimmed },
      include: MESSAGE_INCLUDE,
    });
  }
}
