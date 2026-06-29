import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { QualityInspectionsController } from './quality-inspections.controller';
import { QualityInspectionsService } from './quality-inspections.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [QualityInspectionsController],
  providers: [QualityInspectionsService],
})
export class QualityInspectionsModule {}
