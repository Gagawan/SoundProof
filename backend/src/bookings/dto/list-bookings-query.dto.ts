import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsUUID } from 'class-validator';

/** Filtres de la liste admin de toutes les réservations. */
export class ListBookingsQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filtrer par salle.' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de salle est invalide." })
  roomId?: string;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00.000Z', description: 'Début de période.' })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La date de début est invalide.' })
  from?: Date;

  @ApiPropertyOptional({ example: '2026-09-08T00:00:00.000Z', description: 'Fin de période.' })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La date de fin est invalide.' })
  to?: Date;
}
