import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReportModule } from '../report/report.module';
import { GlJournalsController } from './gl-journals.controller';
import { GlJournalsService } from './gl-journals.service';

@Module({
  imports: [PrismaModule, AuthModule, ReportModule],
  controllers: [GlJournalsController],
  providers: [GlJournalsService],
})
export class GlJournalsModule {}
