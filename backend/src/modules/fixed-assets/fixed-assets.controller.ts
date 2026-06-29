import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';
import { FixedAssetsService } from './fixed-assets.service';

@Controller('api/finance/assets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FixedAssetsController {
  constructor(private fixedAssetsService: FixedAssetsService) {}

  @Get()
  @RequirePermissions('finance:asset')
  findAll() {
    return this.fixedAssetsService.findAll();
  }

  @Post()
  @RequirePermissions('finance:asset')
  create(@Body() dto: CreateFixedAssetDto) {
    return this.fixedAssetsService.create(dto);
  }

  @Post(':id/depreciate')
  @RequirePermissions('finance:asset')
  depreciate(@Param('id') id: string) {
    return this.fixedAssetsService.depreciate(id);
  }

  @Post(':id/dispose')
  @RequirePermissions('finance:asset')
  dispose(@Param('id') id: string) {
    return this.fixedAssetsService.dispose(id);
  }

  @Delete(':id')
  @RequirePermissions('finance:asset')
  remove(@Param('id') id: string) {
    return this.fixedAssetsService.remove(id);
  }
}
