import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

@Controller('api/hr/employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Get()
  @RequirePermissions('hr:employee')
  findAll() {
    return this.employeesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('hr:employee')
  findById(@Param('id') id: string) {
    return this.employeesService.findById(id);
  }

  @Post()
  @RequirePermissions('hr:employee')
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('hr:employee')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('hr:employee')
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}
