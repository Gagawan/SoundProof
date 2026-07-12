import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'marie@soundproof.fr' })
  @IsEmail({}, { message: "L'adresse email est invalide." })
  email!: string;

  @ApiProperty({ example: 'MotDePasseFort1' })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  password!: string;
}
