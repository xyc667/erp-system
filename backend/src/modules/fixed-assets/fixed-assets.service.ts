import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOrderNo } from '../../common/utils/order-no';
import { ReportService } from '../report/report.service';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';

@Injectable()
export class FixedAssetsService {
  constructor(
    private prisma: PrismaService,
    private reportService: ReportService,
  ) {}

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

    const created = await this.prisma.fixedAsset.create({
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
    await this.reportService.invalidateFinanceReportCache();
    return created;
  }

  async depreciate(id: string) {
    const asset = await this.findById(id);
    if (!asset) throw new NotFoundException('固定资产不存在');
    if (asset.status !== 'active') throw new BadRequestException('只能对在用资产计提折旧');

    const monthlyDepreciation = Number(asset.originalValue) / asset.usefulLifeMonths;
    const newAccumulated = Number(asset.accumulatedDepreciation) + monthlyDepreciation;
    const netValue = Number(asset.originalValue) - newAccumulated;

    const updated = await this.prisma.fixedAsset.update({
      where: { id },
      data: {
        accumulatedDepreciation: newAccumulated,
        status: netValue <= 0 ? 'fully_depreciated' : 'active',
      },
    });
    await this.reportService.invalidateFinanceReportCache();
    return updated;
  }

  async dispose(id: string) {
    const asset = await this.findById(id);
    if (!asset) throw new NotFoundException('固定资产不存在');
    if (asset.status === 'disposed') throw new BadRequestException('资产已处置');

    const updated = await this.prisma.fixedAsset.update({
      where: { id },
      data: { status: 'disposed' },
    });
    await this.reportService.invalidateFinanceReportCache();
    return updated;
  }

  async remove(id: string) {
    const asset = await this.findById(id);
    if (!asset) throw new NotFoundException('固定资产不存在');
    const deleted = await this.prisma.fixedAsset.delete({ where: { id } });
    await this.reportService.invalidateFinanceReportCache();
    return deleted;
  }
}
