import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'marie@soundproof.fr' })
  @IsEmail({}, { message: "L'adresse email est invalide." })
  email!: string;

  @ApiProperty({
    example: 'MotDePasseFort1',
    description: '≥ 12 caractères, avec minuscule, majuscule et chiffre.',
  })
  @IsString()
  @MinLength(12, { message: 'Le mot de passe doit contenir au moins 12 caractères.' })
  @MaxLength(128, { message: 'Le mot de passe ne peut pas dépasser 128 caractères.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message: 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre.',
  })
  password!: string;

  @ApiProperty({ example: 'Marie' })
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est requis.' })
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Dubois' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis.' })
  @MaxLength(100)
  lastName!: string;
}
