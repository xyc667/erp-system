import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { SalaryService } from './salary.service';

@Controller('api/hr/salary')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalaryController {
  constructor(private salaryService: SalaryService) {}

  @Get()
  @RequirePermissions('hr:salary')
  findAll() {
    return this.salaryService.findAll();
  }

  @Post()
  @RequirePermissions('hr:salary')
  create(@Body() dto: CreateSalaryDto) {
    return this.salaryService.create(dto);
  }

  @Post(':id/pay')
  @RequirePermissions('hr:salary')
  pay(@Param('id') id: string) {
    return this.salaryService.pay(id);
  }

  @Delete(':id')
  @RequirePermissions('hr:salary')
  remove(@Param('id') id: string) {
    return this.salaryService.remove(id);
  }
}
