import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateBomDto } from './dto/create-bom.dto';
import { UpdateBomDto } from './dto/update-bom.dto';
import { BomsService } from './boms.service';

@Controller('api/production/boms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BomsController {
  constructor(private bomsService: BomsService) {}

  @Get()
  @RequirePermissions('production:bom')
  findAll() {
    return this.bomsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('production:bom')
  findById(@Param('id') id: string) {
    return this.bomsService.findById(id);
  }

  @Post()
  @RequirePermissions('production:bom')
  create(@Body() dto: CreateBomDto) {
    return this.bomsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('production:bom')
  update(@Param('id') id: string, @Body() dto: UpdateBomDto) {
    return this.bomsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('production:bom')
  remove(@Param('id') id: string) {
    return this.bomsService.remove(id);
  }
}
