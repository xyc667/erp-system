import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantService } from '../../common/tenant/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from './storage.service';

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private tenant: TenantService,
  ) {}

  findAll() {
    return this.prisma.fileAsset.findMany({
      where: this.tenant.where(),
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async upload(file: Express.Multer.File, userId: string, tenantId: string) {
    if (!file) throw new BadRequestException('请选择文件');
    const { bucket, objectKey } = await this.storage.upload(file, tenantId);
    return this.prisma.fileAsset.create({
      data: {
        tenantId,
        bucket,
        objectKey,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedById: userId,
      },
      include: { uploadedBy: { select: { id: true, name: true } } },
    });
  }

  async getDownloadUrl(id: string) {
    const asset = await this.prisma.fileAsset.findFirst({
      where: { id, ...this.tenant.where() },
    });
    if (!asset) throw new NotFoundException('文件不存在');
    const url = await this.storage.getPresignedUrl(asset.bucket, asset.objectKey);
    return { url, fileName: asset.fileName };
  }
}
