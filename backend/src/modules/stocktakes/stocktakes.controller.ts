import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateStocktakeDto, UpdateStocktakeItemDto } from './dto/create-stocktake.dto';
import { StocktakesService } from './stocktakes.service';

@Controller('api/inventory/stocktakes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StocktakesController {
  constructor(private stocktakesService: StocktakesService) {}

  @Get()
  @RequirePermissions('inventory:stock', 'inventory:inout')
  findAll() {
    return this.stocktakesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('inventory:stock', 'inventory:inout')
  findById(@Param('id') id: string) {
    return this.stocktakesService.findById(id);
  }

  @Post()
  @RequirePermissions('inventory:inout')
  create(@Body() dto: CreateStocktakeDto, @Request() req: { user: { userId: string } }) {
    return this.stocktakesService.create(dto, req.user.userId);
  }

  @Patch(':id/items/:itemId')
  @RequirePermissions('inventory:inout')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateStocktakeItemDto,
  ) {
    return this.stocktakesService.updateItemCount(id, itemId, dto.countedQty);
  }

  @Post(':id/complete')
  @RequirePermissions('inventory:inout')
  complete(@Param('id') id: string, @Request() req: { user: { userId: string } }) {
    return this.stocktakesService.complete(id, req.user.userId);
  }

  @Delete(':id')
  @RequirePermissions('inventory:inout')
  remove(@Param('id') id: string) {
    return this.stocktakesService.remove(id);
  }
}
