import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateProductionPlanDto } from './dto/create-production-plan.dto';
import { UpdateProductionPlanDto } from './dto/update-production-plan.dto';
import { ProductionPlansService } from './production-plans.service';

@Controller('api/production/plans')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductionPlansController {
  constructor(private productionPlansService: ProductionPlansService) {}

  @Get()
  @RequirePermissions('production:plan')
  findAll() {
    return this.productionPlansService.findAll();
  }

  @Get(':id')
  @RequirePermissions('production:plan')
  findById(@Param('id') id: string) {
    return this.productionPlansService.findById(id);
  }

  @Post()
  @RequirePermissions('production:plan')
  create(@Body() dto: CreateProductionPlanDto, @Request() req: { user: { userId: string } }) {
    return this.productionPlansService.create(dto, req.user.userId);
  }

  @Patch(':id')
  @RequirePermissions('production:plan')
  update(@Param('id') id: string, @Body() dto: UpdateProductionPlanDto) {
    return this.productionPlansService.update(id, dto);
  }

  @Post(':id/approve')
  @RequirePermissions('production:plan')
  approve(@Param('id') id: string) {
    return this.productionPlansService.approve(id);
  }

  @Delete(':id')
  @RequirePermissions('production:plan')
  remove(@Param('id') id: string) {
    return this.productionPlansService.remove(id);
  }
}
