import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token émis à la connexion.' })
  @IsString()
  @IsNotEmpty({ message: 'Le refresh token est requis.' })
  refreshToken!: string;
}
