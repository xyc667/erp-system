import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOrderNo } from '../../common/utils/order-no';
import { InventoryService } from '../inventory/inventory.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { CompleteWorkOrderDto } from './dto/complete-work-order.dto';

const includeRelations = {
  product: true,
  bom: { include: { items: { include: { component: true } } } },
  plan: true,
  warehouse: true,
  createdBy: { select: { id: true, name: true } },
  items: { include: { product: true } },
  inspections: true,
};

@Injectable()
export class WorkOrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  findAll() {
    return this.prisma.workOrder.findMany({
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.workOrder.findUnique({
      where: { id },
      include: includeRelations,
    });
  }

  async create(dto: CreateWorkOrderDto, userId: string) {
    const orderNo = await generateOrderNo('WO', async () => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return this.prisma.workOrder.count({
        where: { orderNo: { startsWith: `WO-${date}` } },
      });
    });

    let bomItems: { componentId: string; quantity: number; unit: string }[] = [];
    if (dto.bomId) {
      const bom = await this.prisma.bom.findUnique({
        where: { id: dto.bomId },
        include: { items: { include: { component: true } } },
      });
      if (!bom) throw new NotFoundException('BOM 不存在');
      bomItems = bom.items.map((item) => ({
        componentId: item.componentId,
        quantity: Number(item.quantity) * dto.plannedQty,
        unit: item.unit,
      }));
    }

    return this.prisma.workOrder.create({
      data: {
        orderNo,
        bomId: dto.bomId,
        productId: dto.productId,
        planId: dto.planId,
        plannedQty: dto.plannedQty,
        warehouseId: dto.warehouseId,
        createdById: userId,
        items: bomItems.length
          ? {
              create: bomItems.map((item) => ({
                productId: item.componentId,
                requiredQty: item.quantity,
              })),
            }
          : undefined,
      },
      include: includeRelations,
    });
  }

  async release(id: string) {
    const order = await this.findById(id);
    if (!order) throw new NotFoundException('工单不存在');
    if (order.status !== 'draft') throw new BadRequestException('只能下达草稿工单');

    return this.prisma.workOrder.update({
      where: { id },
      data: { status: 'released', startDate: new Date() },
      include: includeRelations,
    });
  }

  async start(id: string, userId: string) {
    const order = await this.findById(id);
    if (!order) throw new NotFoundException('工单不存在');
    if (order.status !== 'released') throw new BadRequestException('只能开工已下达工单');

    for (const item of order.items) {
      const stock = await this.prisma.inventory.findFirst({
        where: { productId: item.productId },
      });
      if (!stock || Number(stock.quantity) < Number(item.requiredQty)) {
        throw new BadRequestException(`物料 ${item.product.name} 库存不足`);
      }
    }

    for (const item of order.items) {
      const stock = await this.prisma.inventory.findFirst({
        where: { productId: item.productId },
      });
      if (stock) {
        await this.inventoryService.reduceStock(
          item.productId,
          stock.warehouseId,
          Number(item.requiredQty),
          'production_out',
          userId,
          { no: order.orderNo, type: 'work_order', id: order.id },
        );
        await this.prisma.workOrderItem.update({
          where: { id: item.id },
          data: { consumedQty: item.requiredQty },
        });
      }
    }

    return this.prisma.workOrder.update({
      where: { id },
      data: { status: 'in_progress' },
      include: includeRelations,
    });
  }

  async complete(id: string, dto: CompleteWorkOrderDto, userId: string) {
    const order = await this.findById(id);
    if (!order) throw new NotFoundException('工单不存在');
    if (!['in_progress', 'released'].includes(order.status)) {
      throw new BadRequestException('当前状态不允许完工');
    }

    await this.inventoryService.addStock(
      order.productId,
      dto.warehouseId,
      Number(order.plannedQty),
      'production_in',
      userId,
      { no: order.orderNo, type: 'work_order', id: order.id },
    );

    return this.prisma.workOrder.update({
      where: { id },
      data: {
        status: 'completed',
        completedQty: order.plannedQty,
        warehouseId: dto.warehouseId,
        endDate: new Date(),
      },
      include: includeRelations,
    });
  }

  async remove(id: string) {
    const order = await this.findById(id);
    if (!order) throw new NotFoundException('工单不存在');
    if (order.status !== 'draft') throw new BadRequestException('只能删除草稿工单');

    return this.prisma.workOrder.delete({ where: { id } });
  }
}
