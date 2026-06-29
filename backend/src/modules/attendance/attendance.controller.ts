import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { AttendanceService } from './attendance.service';

@Controller('api/hr/attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Get()
  @RequirePermissions('hr:attendance')
  findAll() {
    return this.attendanceService.findAll();
  }

  @Post()
  @RequirePermissions('hr:attendance')
  create(@Body() dto: CreateAttendanceDto) {
    return this.attendanceService.create(dto);
  }

  @Post(':id/checkout')
  @RequirePermissions('hr:attendance')
  checkOut(@Param('id') id: string) {
    return this.attendanceService.checkOut(id);
  }

  @Delete(':id')
  @RequirePermissions('hr:attendance')
  remove(@Param('id') id: string) {
    return this.attendanceService.remove(id);
  }
}
