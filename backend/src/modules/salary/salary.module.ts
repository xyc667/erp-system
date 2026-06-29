import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { SalaryController } from './salary.controller';
import { SalaryService } from './salary.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SalaryController],
  providers: [SalaryService],
})
export class SalaryModule {}
