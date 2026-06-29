import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { PositionsService } from './positions.service';

@Controller('api/hr/positions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PositionsController {
  constructor(private positionsService: PositionsService) {}

  @Get()
  @RequirePermissions('hr:employee')
  findAll() {
    return this.positionsService.findAll();
  }

  @Post()
  @RequirePermissions('hr:employee')
  create(@Body() dto: CreatePositionDto) {
    return this.positionsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('hr:employee')
  update(@Param('id') id: string, @Body() dto: UpdatePositionDto) {
    return this.positionsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('hr:employee')
  remove(@Param('id') id: string) {
    return this.positionsService.remove(id);
  }
}
