import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsDate, IsOptional, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: "L'identifiant de salle est invalide." })
  roomId!: string;

  @ApiProperty({ example: '2026-09-01T10:00:00.000Z' })
  @Type(() => Date)
  @IsDate({ message: 'La date de début est invalide.' })
  startsAt!: Date;

  @ApiProperty({ example: '2026-09-01T12:00:00.000Z' })
  @Type(() => Date)
  @IsDate({ message: 'La date de fin est invalide.' })
  endsAt!: Date;

  @ApiPropertyOptional({ type: [String], format: 'uuid', description: 'Matériel de la salle.' })
  @IsOptional()
  @IsArray()
  @ArrayUnique({ message: 'Un matériel ne peut être demandé qu’une seule fois.' })
  @IsUUID('4', { each: true, message: 'Un identifiant de matériel est invalide.' })
  equipmentIds?: string[];
}
