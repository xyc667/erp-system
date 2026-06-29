import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SystemController],
  providers: [SystemService],
})
export class SystemModule {}
