import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { QueueService } from '../queue/queue.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const prisma = {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  } as unknown as PrismaService;

  const cache = {
    isRedisConnected: jest.fn().mockReturnValue(false),
  } as unknown as CacheService;

  const queue = {
    isConnected: jest.fn().mockReturnValue(false),
  } as unknown as QueueService;

  const controller = new HealthController(prisma, cache, queue);

  it('returns ok status when database is reachable', async () => {
    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
    expect(result.cache).toBeDefined();
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });
});
