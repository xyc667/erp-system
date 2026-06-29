import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { GlJournalsController } from './gl-journals.controller';
import { GlJournalsService } from './gl-journals.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [GlJournalsController],
  providers: [GlJournalsService],
})
export class GlJournalsModule {}
