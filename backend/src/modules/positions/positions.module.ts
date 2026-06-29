import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PositionsController],
  providers: [PositionsService],
  exports: [PositionsService],
})
export class PositionsModule {}
