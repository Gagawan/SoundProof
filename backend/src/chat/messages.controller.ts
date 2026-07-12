import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ChatService, MessagesPage } from './chat.service';
import { MessagesQueryDto } from './dto/messages-query.dto';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('rooms/:roomId/messages')
export class MessagesController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: "Historique paginé du chat d'une salle (membres de la salle)" })
  async getMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Query() query: MessagesQueryDto,
  ): Promise<MessagesPage> {
    await this.chatService.assertCanAccessRoom(user.id, user.role, roomId);
    return this.chatService.getMessages(roomId, query.cursor);
  }
}
