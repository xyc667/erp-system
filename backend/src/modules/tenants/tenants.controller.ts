import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantsService } from './tenants.service';

@Controller('api/system/tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get('public')
  listPublic() {
    return this.tenantsService.findAll();
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('system:tenant')
  findAll() {
    return this.tenantsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('system:tenant')
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }
}
