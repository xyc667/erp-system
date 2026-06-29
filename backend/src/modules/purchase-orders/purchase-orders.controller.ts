import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@Controller('api/procurement/orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PurchaseOrdersController {
  constructor(private purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  @RequirePermissions('procurement:order', 'procurement:receive')
  findAll() {
    return this.purchaseOrdersService.findAll();
  }

  @Get(':id')
  @RequirePermissions('procurement:order', 'procurement:receive')
  findById(@Param('id') id: string) {
    return this.purchaseOrdersService.findById(id);
  }

  @Post()
  @RequirePermissions('procurement:order')
  create(@Body() dto: CreatePurchaseOrderDto, @Request() req: { user: { userId: string } }) {
    return this.purchaseOrdersService.create(dto, req.user.userId);
  }

  @Patch(':id')
  @RequirePermissions('procurement:order')
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.purchaseOrdersService.update(id, dto);
  }

  @Post(':id/approve')
  @RequirePermissions('procurement:order')
  approve(@Param('id') id: string, @Request() req: { user: { userId: string; tenantId?: string } }) {
    return this.purchaseOrdersService.approve(id, req.user.userId, req.user.tenantId);
  }

  @Post(':id/receive')
  @RequirePermissions('procurement:receive', 'procurement:order')
  receive(
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.purchaseOrdersService.receive(id, dto, req.user.userId);
  }

  @Delete(':id')
  @RequirePermissions('procurement:order')
  remove(@Param('id') id: string) {
    return this.purchaseOrdersService.remove(id);
  }
}
