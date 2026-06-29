import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehousesService } from './warehouses.service';

@Controller('api/inventory/warehouses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WarehousesController {
  constructor(private warehousesService: WarehousesService) {}

  @Get()
  @RequirePermissions('inventory:stock')
  findAll() {
    return this.warehousesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('inventory:stock')
  findById(@Param('id') id: string) {
    return this.warehousesService.findById(id);
  }

  @Post()
  @RequirePermissions('inventory:stock')
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehousesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('inventory:stock')
  update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehousesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('inventory:stock')
  remove(@Param('id') id: string) {
    return this.warehousesService.remove(id);
  }
}
