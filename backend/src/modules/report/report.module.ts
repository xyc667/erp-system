import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReportController } from './report.controller';
import { DashboardController } from './dashboard.controller';
import { ReportService } from './report.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ReportController, DashboardController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
