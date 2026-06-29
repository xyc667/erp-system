import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [HealthController],
})
export class HealthModule {}
