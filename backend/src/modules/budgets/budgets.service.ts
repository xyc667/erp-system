import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantService } from '../../common/tenant/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
    private queue: QueueService,
  ) {}

  findAll() {
    return this.prisma.budget.findMany({
      where: this.tenant.where(),
      include: { department: true },
      orderBy: [{ year: 'desc' }, { code: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.budget.findFirst({
      where: { id, ...this.tenant.where() },
      include: { department: true, usages: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
  }

  create(dto: CreateBudgetDto) {
    const tenantId = this.tenant.getTenantId();
    if (!tenantId) throw new BadRequestException('租户上下文缺失');

    return this.prisma.budget.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        year: dto.year,
        category: dto.category,
        departmentId: dto.departmentId,
        totalAmount: dto.totalAmount,
      },
      include: { department: true },
    });
  }

  async update(id: string, dto: UpdateBudgetDto) {
    const budget = await this.findById(id);
    if (!budget) throw new NotFoundException('预算不存在');
    return this.prisma.budget.update({
      where: { id },
      data: dto,
      include: { department: true },
    });
  }

  async remove(id: string) {
    const budget = await this.findById(id);
    if (!budget) throw new NotFoundException('预算不存在');
    return this.prisma.budget.delete({ where: { id } });
  }

  async recordUsage(
    category: string,
    amount: number,
    reference: { type: string; id: string; no: string },
    userId?: string,
  ) {
    const tenantId = this.tenant.getTenantId();
    if (!tenantId) return null;

    const year = new Date().getFullYear();
    const budget = await this.prisma.budget.findFirst({
      where: { tenantId, year, category, status: 'active' },
      orderBy: { createdAt: 'asc' },
    });
    if (!budget) return null;

    const newUsed = Number(budget.usedAmount) + amount;
    await this.prisma.$transaction(async (tx) => {
      await tx.budgetUsage.create({
        data: {
          budgetId: budget.id,
          amount,
          referenceType: reference.type,
          referenceId: reference.id,
          referenceNo: reference.no,
          description: `${reference.type} ${reference.no}`,
        },
      });
      await tx.budget.update({
        where: { id: budget.id },
        data: { usedAmount: newUsed },
      });
    });

    if (newUsed > Number(budget.totalAmount)) {
      await this.queue.publish({
        type: 'budget.exceeded',
        tenantId,
        userId,
        title: '预算超支预警',
        message: `预算 ${budget.name}(${budget.code}) 已使用 ${newUsed.toFixed(2)}，超出总额 ${Number(budget.totalAmount).toFixed(2)}`,
        payload: { budgetId: budget.id, used: newUsed, total: Number(budget.totalAmount) },
      });
    }

    return budget;
  }
}
