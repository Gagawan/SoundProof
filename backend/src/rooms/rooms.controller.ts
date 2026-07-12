import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, Room } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { OccupiedSlot, RoomsService, RoomWithEquipments } from './rooms.service';

@ApiTags('rooms')
@ApiBearerAuth()
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les salles actives avec leur matériel' })
  findAll(): Promise<RoomWithEquipments[]> {
    return this.roomsService.findAllActive();
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une salle" })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<RoomWithEquipments> {
    return this.roomsService.findOne(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: "Créneaux occupés d'une salle sur une période" })
  getAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: AvailabilityQueryDto,
  ): Promise<OccupiedSlot[]> {
    return this.roomsService.getAvailability(id, query.from, query.to);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Créer une salle (ADMIN)' })
  create(@Body() dto: CreateRoomDto): Promise<Room> {
    return this.roomsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Modifier une salle (ADMIN)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoomDto): Promise<Room> {
    return this.roomsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactiver une salle (ADMIN, désactivation logique)' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.roomsService.deactivate(id);
  }
}
