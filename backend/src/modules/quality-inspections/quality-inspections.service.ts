import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOrderNo } from '../../common/utils/order-no';
import { CreateQualityInspectionDto } from './dto/create-quality-inspection.dto';

const includeRelations = {
  workOrder: { include: { product: true } },
  product: true,
  inspectedBy: { select: { id: true, name: true } },
};

@Injectable()
export class QualityInspectionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.qualityInspection.findMany({
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.qualityInspection.findUnique({
      where: { id },
      include: includeRelations,
    });
  }

  async create(dto: CreateQualityInspectionDto, userId: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: dto.workOrderId },
      include: { product: true },
    });
    if (!workOrder) throw new NotFoundException('工单不存在');
    if (!['in_progress', 'completed'].includes(workOrder.status)) {
      throw new BadRequestException('只能对进行中或已完工工单进行质检');
    }

    if (dto.passedQty + dto.failedQty !== dto.inspectedQty) {
      throw new BadRequestException('合格数与不合格数之和应等于检验数量');
    }

    const inspectionNo = await generateOrderNo('QI', async () => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return this.prisma.qualityInspection.count({
        where: { inspectionNo: { startsWith: `QI-${date}` } },
      });
    });

    const status = dto.failedQty > 0 ? 'failed' : 'passed';

    return this.prisma.qualityInspection.create({
      data: {
        inspectionNo,
        workOrderId: dto.workOrderId,
        productId: workOrder.productId,
        inspectedQty: dto.inspectedQty,
        passedQty: dto.passedQty,
        failedQty: dto.failedQty,
        status,
        result: dto.result,
        inspectedById: userId,
        inspectedAt: new Date(),
      },
      include: includeRelations,
    });
  }

  async remove(id: string) {
    const inspection = await this.findById(id);
    if (!inspection) throw new NotFoundException('质检单不存在');

    return this.prisma.qualityInspection.delete({ where: { id } });
  }
}
