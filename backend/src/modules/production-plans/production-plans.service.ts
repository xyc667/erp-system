import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOrderNo } from '../../common/utils/order-no';
import { CreateProductionPlanDto } from './dto/create-production-plan.dto';
import { UpdateProductionPlanDto } from './dto/update-production-plan.dto';

const includeRelations = {
  product: true,
  createdBy: { select: { id: true, name: true } },
  workOrders: true,
};

@Injectable()
export class ProductionPlansService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.productionPlan.findMany({
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.productionPlan.findUnique({
      where: { id },
      include: includeRelations,
    });
  }

  async create(dto: CreateProductionPlanDto, userId: string) {
    const planNo = await generateOrderNo('PP', async () => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return this.prisma.productionPlan.count({
        where: { planNo: { startsWith: `PP-${date}` } },
      });
    });

    return this.prisma.productionPlan.create({
      data: {
        planNo,
        name: dto.name,
        productId: dto.productId,
        plannedQty: dto.plannedQty,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        createdById: userId,
      },
      include: includeRelations,
    });
  }

  async update(id: string, dto: UpdateProductionPlanDto) {
    const plan = await this.findById(id);
    if (!plan) throw new NotFoundException('生产计划不存在');
    if (plan.status !== 'draft') throw new BadRequestException('只能修改草稿计划');

    return this.prisma.productionPlan.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: includeRelations,
    });
  }

  async approve(id: string) {
    const plan = await this.findById(id);
    if (!plan) throw new NotFoundException('生产计划不存在');
    if (plan.status !== 'draft') throw new BadRequestException('只能审批草稿计划');

    return this.prisma.productionPlan.update({
      where: { id },
      data: { status: 'approved' },
      include: includeRelations,
    });
  }

  async remove(id: string) {
    const plan = await this.findById(id);
    if (!plan) throw new NotFoundException('生产计划不存在');
    if (plan.status !== 'draft') throw new BadRequestException('只能删除草稿计划');

    return this.prisma.productionPlan.delete({ where: { id } });
  }
}
