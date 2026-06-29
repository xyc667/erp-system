import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: Minio.Client | null = null;
  private defaultBucket = process.env.MINIO_BUCKET || 'erp-files';

  isConfigured() {
    return !!process.env.MINIO_ENDPOINT;
  }

  onModuleInit() {
    if (!this.isConfigured()) {
      this.logger.log('MINIO_ENDPOINT not set — object storage disabled');
      return;
    }
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT!,
      port: Number(process.env.MINIO_PORT || 9000),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
    void this.ensureBucket();
  }

  private async ensureBucket() {
    if (!this.client) return;
    const exists = await this.client.bucketExists(this.defaultBucket);
    if (!exists) {
      await this.client.makeBucket(this.defaultBucket, '');
      this.logger.log(`Created bucket: ${this.defaultBucket}`);
    }
  }

  async upload(
    file: Express.Multer.File,
    tenantId: string,
  ): Promise<{ bucket: string; objectKey: string }> {
    const objectKey = `${tenantId}/${randomUUID()}-${file.originalname}`;
    if (!this.client) {
      return { bucket: 'local', objectKey };
    }
    await this.client.putObject(this.defaultBucket, objectKey, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });
    return { bucket: this.defaultBucket, objectKey };
  }

  async getPresignedUrl(bucket: string, objectKey: string) {
    if (!this.client || bucket === 'local') return null;
    return this.client.presignedGetObject(bucket, objectKey, 3600);
  }
}
