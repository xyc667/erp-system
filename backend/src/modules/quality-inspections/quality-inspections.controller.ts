import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateQualityInspectionDto } from './dto/create-quality-inspection.dto';
import { QualityInspectionsService } from './quality-inspections.service';

@Controller('api/production/inspections')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QualityInspectionsController {
  constructor(private qualityInspectionsService: QualityInspectionsService) {}

  @Get()
  @RequirePermissions('production:quality')
  findAll() {
    return this.qualityInspectionsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('production:quality')
  findById(@Param('id') id: string) {
    return this.qualityInspectionsService.findById(id);
  }

  @Post()
  @RequirePermissions('production:quality')
  create(@Body() dto: CreateQualityInspectionDto, @Request() req: { user: { userId: string } }) {
    return this.qualityInspectionsService.create(dto, req.user.userId);
  }

  @Delete(':id')
  @RequirePermissions('production:quality')
  remove(@Param('id') id: string) {
    return this.qualityInspectionsService.remove(id);
  }
}
