import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class AvailabilityQueryDto {
  @ApiProperty({ example: '2026-09-01T00:00:00.000Z', description: 'Début de la période.' })
  @Type(() => Date)
  @IsDate({ message: 'La date de début est invalide.' })
  from!: Date;

  @ApiProperty({ example: '2026-09-08T00:00:00.000Z', description: 'Fin de la période.' })
  @Type(() => Date)
  @IsDate({ message: 'La date de fin est invalide.' })
  to!: Date;
}
