import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PerformanceController],
  providers: [PerformanceService],
})
export class PerformanceModule {}
