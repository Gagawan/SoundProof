import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: 'Studio A — Le Garage' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la salle est requis.' })
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'Grande salle adaptée aux groupes complets.' })
  @IsString()
  @IsNotEmpty({ message: 'La description est requise.' })
  @MaxLength(1000)
  description!: string;

  @ApiProperty({ example: 6, minimum: 1, maximum: 100 })
  @IsInt({ message: 'La capacité doit être un entier.' })
  @Min(1, { message: 'La capacité minimale est de 1 personne.' })
  @Max(100, { message: 'La capacité maximale est de 100 personnes.' })
  capacity!: number;
}
