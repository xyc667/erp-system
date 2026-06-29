import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { InventoryService } from './inventory.service';

@Controller('api/inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('stock')
  @RequirePermissions('inventory:stock')
  findAll() {
    return this.inventoryService.findAll();
  }

  @Get('stock/:id')
  @RequirePermissions('inventory:stock')
  findById(@Param('id') id: string) {
    return this.inventoryService.findById(id);
  }

  @Post('stock')
  @RequirePermissions('inventory:stock')
  create(@Body() dto: CreateInventoryDto) {
    return this.inventoryService.create(dto);
  }

  @Patch('stock/:id')
  @RequirePermissions('inventory:stock')
  update(@Param('id') id: string, @Body() dto: UpdateInventoryDto) {
    return this.inventoryService.update(id, dto);
  }

  @Delete('stock/:id')
  @RequirePermissions('inventory:stock')
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }

  @Get('movements')
  @RequirePermissions('inventory:inout', 'inventory:stock')
  findMovements() {
    return this.inventoryService.findMovements();
  }

  @Post('movements')
  @RequirePermissions('inventory:inout')
  adjustStock(@Body() dto: AdjustStockDto, @Request() req: { user: { userId: string } }) {
    return this.inventoryService.adjustStock(dto, req.user.userId);
  }

  @Get('alerts')
  @RequirePermissions('inventory:alert', 'inventory:stock')
  findAlerts() {
    return this.inventoryService.findAlerts();
  }

  @Post('transfers')
  @RequirePermissions('inventory:inout')
  transferStock(@Body() dto: TransferStockDto, @Request() req: { user: { userId: string } }) {
    return this.inventoryService.transferStock(dto, req.user.userId);
  }
}
