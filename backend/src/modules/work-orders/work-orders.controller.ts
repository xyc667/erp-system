import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CompleteWorkOrderDto } from './dto/complete-work-order.dto';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { WorkOrdersService } from './work-orders.service';

@Controller('api/production/work-orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkOrdersController {
  constructor(private workOrdersService: WorkOrdersService) {}

  @Get()
  @RequirePermissions('production:workorder', 'production:quality')
  findAll() {
    return this.workOrdersService.findAll();
  }

  @Get(':id')
  @RequirePermissions('production:workorder', 'production:quality')
  findById(@Param('id') id: string) {
    return this.workOrdersService.findById(id);
  }

  @Post()
  @RequirePermissions('production:workorder')
  create(@Body() dto: CreateWorkOrderDto, @Request() req: { user: { userId: string } }) {
    return this.workOrdersService.create(dto, req.user.userId);
  }

  @Post(':id/release')
  @RequirePermissions('production:workorder')
  release(@Param('id') id: string) {
    return this.workOrdersService.release(id);
  }

  @Post(':id/start')
  @RequirePermissions('production:workorder')
  start(@Param('id') id: string, @Request() req: { user: { userId: string } }) {
    return this.workOrdersService.start(id, req.user.userId);
  }

  @Post(':id/complete')
  @RequirePermissions('production:workorder')
  complete(
    @Param('id') id: string,
    @Body() dto: CompleteWorkOrderDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.workOrdersService.complete(id, dto, req.user.userId);
  }

  @Delete(':id')
  @RequirePermissions('production:workorder')
  remove(@Param('id') id: string) {
    return this.workOrdersService.remove(id);
  }
}
