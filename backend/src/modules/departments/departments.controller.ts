import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentsService } from './departments.service';

@Controller('api/hr/departments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Get()
  @RequirePermissions('hr:employee')
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('hr:employee')
  findById(@Param('id') id: string) {
    return this.departmentsService.findById(id);
  }

  @Post()
  @RequirePermissions('hr:employee')
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('hr:employee')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('hr:employee')
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
