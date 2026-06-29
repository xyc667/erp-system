import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';

@Controller('api/permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('permission:manage', 'role:manage')
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('module/:module')
  @RequirePermissions('permission:manage', 'role:manage')
  findByModule(@Param('module') module: string) {
    return this.permissionsService.findByModule(module);
  }

  @Get(':id')
  @RequirePermissions('permission:manage', 'role:manage')
  findById(@Param('id') id: string) {
    return this.permissionsService.findById(id);
  }

  @Post()
  @RequirePermissions('permission:manage')
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Patch(':id')
  @RequirePermissions('permission:manage')
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @RequirePermissions('permission:manage')
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}