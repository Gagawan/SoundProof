import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class MessagesQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Cursor de pagination (id du dernier message reçu).',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Le cursor est invalide.' })
  cursor?: string;
}
