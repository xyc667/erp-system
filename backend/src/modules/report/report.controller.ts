import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { ReportService } from './report.service';

@Controller('api/report')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Get('overview')
  @RequirePermissions('report:center')
  getOverview() {
    return this.reportService.getOverview();
  }

  @Get('finance')
  @RequirePermissions('finance:report', 'report:center')
  getFinanceReport() {
    return this.reportService.getFinanceReport();
  }
}
