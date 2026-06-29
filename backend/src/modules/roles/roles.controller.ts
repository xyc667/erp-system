import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';

@Controller('api/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @RequirePermissions('role:manage', 'user:manage')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('role:manage', 'user:manage')
  findById(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Post()
  @RequirePermissions('role:manage')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Patch(':id')
  @RequirePermissions('role:manage')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermissions('role:manage')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Post(':id/permissions')
  @RequirePermissions('role:manage', 'permission:manage')
  assignPermissions(
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, assignPermissionsDto.permissionIds);
  }
}