import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateSalesQuoteDto } from './dto/create-sales-quote.dto';
import { SalesQuotesService } from './sales-quotes.service';

@Controller('api/sales/quotes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalesQuotesController {
  constructor(private salesQuotesService: SalesQuotesService) {}

  @Get()
  @RequirePermissions('sales:quote')
  findAll() {
    return this.salesQuotesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('sales:quote')
  findById(@Param('id') id: string) {
    return this.salesQuotesService.findById(id);
  }

  @Post()
  @RequirePermissions('sales:quote')
  create(@Body() dto: CreateSalesQuoteDto, @Request() req: { user: { userId: string } }) {
    return this.salesQuotesService.create(dto, req.user.userId);
  }

  @Post(':id/approve')
  @RequirePermissions('sales:quote', 'sales:order')
  approve(@Param('id') id: string) {
    return this.salesQuotesService.approve(id);
  }

  @Post(':id/convert')
  @RequirePermissions('sales:order')
  convert(@Param('id') id: string, @Request() req: { user: { userId: string } }) {
    return this.salesQuotesService.convertToOrder(id, req.user.userId);
  }

  @Delete(':id')
  @RequirePermissions('sales:quote')
  remove(@Param('id') id: string) {
    return this.salesQuotesService.remove(id);
  }
}
