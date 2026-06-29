import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProductionPlansController } from './production-plans.controller';
import { ProductionPlansService } from './production-plans.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProductionPlansController],
  providers: [ProductionPlansService],
  exports: [ProductionPlansService],
})
export class ProductionPlansModule {}
