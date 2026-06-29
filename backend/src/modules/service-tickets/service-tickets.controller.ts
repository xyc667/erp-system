import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import {
  CreateServiceTicketDto,
  ResolveServiceTicketDto,
  UpdateServiceTicketStatusDto,
} from './dto/create-service-ticket.dto';
import { ServiceTicketsService } from './service-tickets.service';

@Controller('api/sales/service-tickets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ServiceTicketsController {
  constructor(private serviceTicketsService: ServiceTicketsService) {}

  @Get()
  @RequirePermissions('sales:service')
  findAll() {
    return this.serviceTicketsService.findAll();
  }

  @Post()
  @RequirePermissions('sales:service')
  create(@Body() dto: CreateServiceTicketDto, @Request() req: { user: { userId: string } }) {
    return this.serviceTicketsService.create(dto, req.user.userId);
  }

  @Patch(':id/status')
  @RequirePermissions('sales:service')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateServiceTicketStatusDto) {
    return this.serviceTicketsService.updateStatus(id, dto.status);
  }

  @Post(':id/resolve')
  @RequirePermissions('sales:service')
  resolve(@Param('id') id: string, @Body() dto: ResolveServiceTicketDto) {
    return this.serviceTicketsService.resolve(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('sales:service')
  remove(@Param('id') id: string) {
    return this.serviceTicketsService.remove(id);
  }
}
