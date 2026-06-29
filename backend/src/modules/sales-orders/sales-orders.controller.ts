import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { ShipSalesOrderDto } from './dto/ship-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { SalesOrdersService } from './sales-orders.service';

@Controller('api/sales/orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalesOrdersController {
  constructor(private salesOrdersService: SalesOrdersService) {}

  @Get()
  @RequirePermissions('sales:order', 'sales:delivery')
  findAll() {
    return this.salesOrdersService.findAll();
  }

  @Get(':id')
  @RequirePermissions('sales:order', 'sales:delivery')
  findById(@Param('id') id: string) {
    return this.salesOrdersService.findById(id);
  }

  @Post()
  @RequirePermissions('sales:order')
  create(@Body() dto: CreateSalesOrderDto, @Request() req: { user: { userId: string } }) {
    return this.salesOrdersService.create(dto, req.user.userId);
  }

  @Patch(':id')
  @RequirePermissions('sales:order')
  update(@Param('id') id: string, @Body() dto: UpdateSalesOrderDto) {
    return this.salesOrdersService.update(id, dto);
  }

  @Post(':id/approve')
  @RequirePermissions('sales:order')
  approve(@Param('id') id: string) {
    return this.salesOrdersService.approve(id);
  }

  @Post(':id/ship')
  @RequirePermissions('sales:delivery', 'sales:order')
  ship(
    @Param('id') id: string,
    @Body() dto: ShipSalesOrderDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.salesOrdersService.ship(id, dto, req.user.userId);
  }

  @Delete(':id')
  @RequirePermissions('sales:order')
  remove(@Param('id') id: string) {
    return this.salesOrdersService.remove(id);
  }
}
