import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis | null = null;
  private memory = new Map<string, { value: string; expiresAt: number }>();

  async onModuleInit() {
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
      });
    }
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  isRedisConnected(): boolean {
    return this.redis?.status === 'ready';
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis) {
      try {
        const raw = await this.redis.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    }

    const entry = this.memory.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    const raw = JSON.stringify(value);
    if (this.redis) {
      try {
        await this.redis.set(key, raw, 'EX', ttlSeconds);
        return;
      } catch {
        // fall through to memory cache
      }
    }
    this.memory.set(key, { value: raw, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch {
        // ignore
      }
    }
    this.memory.delete(key);
  }
}
