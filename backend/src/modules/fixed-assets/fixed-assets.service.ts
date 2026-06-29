import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOrderNo } from '../../common/utils/order-no';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';

@Injectable()
export class FixedAssetsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.fixedAsset.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findById(id: string) {
    return this.prisma.fixedAsset.findUnique({ where: { id } });
  }

  async create(dto: CreateFixedAssetDto) {
    const assetNo = await generateOrderNo('FA', async () => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return this.prisma.fixedAsset.count({
        where: { assetNo: { startsWith: `FA-${date}` } },
      });
    });

    return this.prisma.fixedAsset.create({
      data: {
        assetNo,
        name: dto.name,
        category: dto.category,
        originalValue: dto.originalValue,
        usefulLifeMonths: dto.usefulLifeMonths,
        startDate: new Date(dto.startDate),
        location: dto.location,
      },
    });
  }

  async depreciate(id: string) {
    const asset = await this.findById(id);
    if (!asset) throw new NotFoundException('固定资产不存在');
    if (asset.status !== 'active') throw new BadRequestException('只能对在用资产计提折旧');

    const monthlyDepreciation = Number(asset.originalValue) / asset.usefulLifeMonths;
    const newAccumulated = Number(asset.accumulatedDepreciation) + monthlyDepreciation;
    const netValue = Number(asset.originalValue) - newAccumulated;

    return this.prisma.fixedAsset.update({
      where: { id },
      data: {
        accumulatedDepreciation: newAccumulated,
        status: netValue <= 0 ? 'fully_depreciated' : 'active',
      },
    });
  }

  async dispose(id: string) {
    const asset = await this.findById(id);
    if (!asset) throw new NotFoundException('固定资产不存在');
    if (asset.status === 'disposed') throw new BadRequestException('资产已处置');

    return this.prisma.fixedAsset.update({
      where: { id },
      data: { status: 'disposed' },
    });
  }

  async remove(id: string) {
    const asset = await this.findById(id);
    if (!asset) throw new NotFoundException('固定资产不存在');
    return this.prisma.fixedAsset.delete({ where: { id } });
  }
}
