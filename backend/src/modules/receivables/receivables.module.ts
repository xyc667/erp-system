import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReceivablesController } from './receivables.controller';
import { ReceivablesService } from './receivables.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ReceivablesController],
  providers: [ReceivablesService],
  exports: [ReceivablesService],
})
export class ReceivablesModule {}
