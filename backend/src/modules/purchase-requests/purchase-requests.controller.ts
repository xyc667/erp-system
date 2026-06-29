import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { ConvertPurchaseRequestDto, CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { PurchaseRequestsService } from './purchase-requests.service';

@Controller('api/procurement/requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PurchaseRequestsController {
  constructor(private purchaseRequestsService: PurchaseRequestsService) {}

  @Get()
  @RequirePermissions('procurement:request')
  findAll() {
    return this.purchaseRequestsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('procurement:request')
  findById(@Param('id') id: string) {
    return this.purchaseRequestsService.findById(id);
  }

  @Post()
  @RequirePermissions('procurement:request')
  create(@Body() dto: CreatePurchaseRequestDto, @Request() req: { user: { userId: string } }) {
    return this.purchaseRequestsService.create(dto, req.user.userId);
  }

  @Post(':id/approve')
  @RequirePermissions('procurement:request', 'procurement:order')
  approve(@Param('id') id: string, @Request() req: { user: { userId: string } }) {
    return this.purchaseRequestsService.approve(id, req.user.userId);
  }

  @Post(':id/convert')
  @RequirePermissions('procurement:order')
  convert(
    @Param('id') id: string,
    @Body() dto: ConvertPurchaseRequestDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.purchaseRequestsService.convertToOrder(id, dto, req.user.userId);
  }

  @Delete(':id')
  @RequirePermissions('procurement:request')
  remove(@Param('id') id: string) {
    return this.purchaseRequestsService.remove(id);
  }
}
