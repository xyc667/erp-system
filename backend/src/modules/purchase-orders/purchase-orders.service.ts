import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOrderNo } from '../../common/utils/order-no';
import { InventoryService } from '../inventory/inventory.service';
import { PayablesService } from '../payables/payables.service';
import { QueueService } from '../queue/queue.service';
import { BudgetsService } from '../budgets/budgets.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';

const includeRelations = {
  vendor: true,
  createdBy: { select: { id: true, name: true } },
  approvedBy: { select: { id: true, name: true } },
  items: { include: { product: true } },
};

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private payablesService: PayablesService,
    private budgetsService: BudgetsService,
    private queueService: QueueService,
  ) {}

  findAll() {
    return this.prisma.purchaseOrder.findMany({
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: includeRelations,
    });
  }

  async create(dto: CreatePurchaseOrderDto, userId: string) {
    if (!dto.items?.length) throw new BadRequestException('订单明细不能为空');

    const orderNo = await generateOrderNo('PO', async () => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return this.prisma.purchaseOrder.count({
        where: { orderNo: { startsWith: `PO-${date}` } },
      });
    });

    const items = dto.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
    }));
    const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);

    return this.prisma.purchaseOrder.create({
      data: {
        orderNo,
        vendorId: dto.vendorId,
        totalAmount,
        createdById: userId,
        items: { create: items },
      },
      include: includeRelations,
    });
  }

  async update(id: string, dto: UpdatePurchaseOrderDto) {
    const order = await this.findById(id);
    if (!order) throw new NotFoundException('采购订单不存在');
    if (order.status !== 'draft') throw new BadRequestException('只能修改草稿订单');

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: dto,
      include: includeRelations,
    });
  }

  async approve(id: string, userId: string, tenantId?: string) {
    const order = await this.findById(id);
    if (!order) throw new NotFoundException('采购订单不存在');
    if (order.status !== 'draft') throw new BadRequestException('只能审批草稿订单');

    await this.budgetsService.assertWithinBudget('procurement', Number(order.totalAmount));

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'approved',
        approvedById: userId,
        approvedAt: new Date(),
      },
      include: includeRelations,
    });

    await this.budgetsService.recordUsage(
      'procurement',
      Number(updated.totalAmount),
      { type: 'purchase_order', id: updated.id, no: updated.orderNo },
      userId,
    );

    if (tenantId) {
      await this.queueService.publish({
        type: 'order.approved',
        tenantId,
        userId,
        title: '采购订单已审批',
        message: `采购订单 ${updated.orderNo} 已审批通过，金额 ${Number(updated.totalAmount).toFixed(2)}`,
        payload: { orderId: updated.id, orderNo: updated.orderNo },
      });
    }

    return updated;
  }

  async receive(id: string, dto: ReceivePurchaseOrderDto, userId: string) {
    const order = await this.findById(id);
    if (!order) throw new NotFoundException('采购订单不存在');
    if (!['approved', 'sent', 'confirmed'].includes(order.status)) {
      throw new BadRequestException('当前状态不允许收货');
    }

    for (const item of order.items) {
      await this.inventoryService.addStock(
        item.productId,
        dto.warehouseId,
        Number(item.quantity),
        'purchase_in',
        userId,
        { no: order.orderNo, type: 'purchase_order', id: order.id },
      );
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'completed' },
      include: includeRelations,
    });

    await this.payablesService.createFromPurchaseOrder(updated);
    return updated;
  }

  async remove(id: string) {
    const order = await this.findById(id);
    if (!order) throw new NotFoundException('采购订单不存在');
    if (order.status !== 'draft') throw new BadRequestException('只能删除草稿订单');

    return this.prisma.purchaseOrder.delete({ where: { id } });
  }
}
