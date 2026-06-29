import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { BomsController } from './boms.controller';
import { BomsService } from './boms.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BomsController],
  providers: [BomsService],
  exports: [BomsService],
})
export class BomsModule {}
