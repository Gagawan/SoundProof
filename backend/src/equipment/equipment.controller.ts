import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Equipment, Role } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentService } from './equipment.service';

@ApiTags('equipment')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('rooms/:roomId/equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @ApiOperation({ summary: 'Ajouter du matériel à une salle (ADMIN)' })
  create(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: CreateEquipmentDto,
  ): Promise<Equipment> {
    return this.equipmentService.create(roomId, dto);
  }

  @Patch(':equipmentId')
  @ApiOperation({ summary: 'Modifier un matériel (ADMIN)' })
  update(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Param('equipmentId', ParseUUIDPipe) equipmentId: string,
    @Body() dto: UpdateEquipmentDto,
  ): Promise<Equipment> {
    return this.equipmentService.update(roomId, equipmentId, dto);
  }

  @Delete(':equipmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactiver un matériel (ADMIN, désactivation logique)' })
  async deactivate(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Param('equipmentId', ParseUUIDPipe) equipmentId: string,
  ): Promise<void> {
    await this.equipmentService.deactivate(roomId, equipmentId);
  }
}
