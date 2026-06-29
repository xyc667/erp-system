import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { PerformanceService } from './performance.service';

@Controller('api/hr/performance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PerformanceController {
  constructor(private performanceService: PerformanceService) {}

  @Get()
  @RequirePermissions('hr:performance')
  findAll() {
    return this.performanceService.findAll();
  }

  @Post()
  @RequirePermissions('hr:performance')
  create(@Body() dto: CreatePerformanceDto, @Request() req: { user: { userId: string } }) {
    return this.performanceService.create(dto, req.user.userId);
  }

  @Delete(':id')
  @RequirePermissions('hr:performance')
  remove(@Param('id') id: string) {
    return this.performanceService.remove(id);
  }
}
