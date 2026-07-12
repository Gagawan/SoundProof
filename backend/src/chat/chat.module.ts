import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { MessagesController } from './messages.controller';

@Module({
  imports: [AuthModule],
  controllers: [MessagesController],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
