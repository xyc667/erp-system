import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { QueueService } from '../queue/queue.service';

@Controller('api/health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private queue: QueueService,
  ) {}

  @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      redis: process.env.REDIS_URL
        ? { configured: true, connected: this.cache.isRedisConnected() }
        : { configured: false, connected: false },
      cache: process.env.REDIS_URL ? 'redis' : 'memory',
      rabbitmq: process.env.RABBITMQ_URL
        ? { configured: true, connected: this.queue.isConnected() }
        : { configured: false, connected: false },
    };
  }
}
