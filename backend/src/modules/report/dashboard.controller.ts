import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportService } from './report.service';

@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private reportService: ReportService) {}

  @Get('stats')
  getStats() {
    return this.reportService.getOverview();
  }
}
