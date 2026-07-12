import { ApiProperty } from '@nestjs/swagger';
import { EquipmentCategory } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateEquipmentDto {
  @ApiProperty({ example: 'Ampli guitare Marshall JCM900' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom du matériel est requis.' })
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: EquipmentCategory, example: EquipmentCategory.AMPLIFIER })
  @IsEnum(EquipmentCategory, { message: 'Catégorie de matériel invalide.' })
  category!: EquipmentCategory;
}
