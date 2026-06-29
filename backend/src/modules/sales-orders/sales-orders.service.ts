import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOrderNo } from '../../common/utils/order-no';
import { InventoryService } from '../inventory/inventory.service';
import { ReceivablesService } from '../receivables/receivables.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { ShipSalesOrderDto } from './dto/ship-sales-order.dto';

const includeRelations = {
  customer: true,
  createdBy: { select: { id: true, name: true } },
  items: { include: { product: true } },
};

@Injectable()
export class SalesOrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private receivablesService: ReceivablesService,
  ) {}

  findAll() {
    return this.prisma.salesOrder.findMany({
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.salesOrder.findUnique({
      where: { id },
      include: includeRelations,
    });
  }

  async create(dto: CreateSalesOrderDto, userId: string) {
    if (!dto.items?.length) throw new BadRequestException('订单明细不能为空');

    const orderNo = await generateOrderNo('SO', async () => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return this.prisma.salesOrder.count({
        where: { orderNo: { startsWith: `SO-${date}` } },
      });
    });

    const items = dto.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
    }));
    const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);

    return this.prisma.salesOrder.create({
      data: {
        orderNo,
        customerId: dto.customerId,
        totalAmount,
        createdById: userId,
        items: { create: items },
      },
      include: includeRelations,
    });
  }

  async update(id: string, dto: UpdateSalesOrderDto) {
    const order = await this.findById(id);
    if (!order) throw new NotFoundException('销售订单不存在');
    if (order.status !== 'draft') throw new BadRequestException('只能修改草稿订单');

    return this.prisma.salesOrder.update({
      where: { id },
      data: dto,
      include: includeRelations,
    });
  }

  async approve(id: string) {
    const order = await this.findById(id);
    if (!order) throw new NotFoundException('销售订单不存在');
    if (order.status !== 'draft') throw new BadRequestException('只能审批草稿订单');

    return this.prisma.salesOrder.update({
      where: { id },
      data: { status: 'approved' },
      include: includeRelations,
    });
  }

  async ship(id: string, dto: ShipSalesOrderDto, userId: string) {
    const order = await this.findById(id);
    if (!order) throw new NotFoundException('销售订单不存在');
    if (order.status !== 'approved') throw new BadRequestException('只能发货已审批订单');

    for (const item of order.items) {
      const stock = await this.prisma.inventory.findFirst({
        where: { productId: item.productId, warehouseId: dto.warehouseId },
      });
      if (!stock || Number(stock.quantity) < Number(item.quantity)) {
        throw new BadRequestException(`产品 ${item.product.name} 库存不足`);
      }

      await this.inventoryService.reduceStock(
        item.productId,
        dto.warehouseId,
        Number(item.quantity),
        'sales_out',
        userId,
        { no: order.orderNo, type: 'sales_order', id: order.id },
      );
    }

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: { status: 'shipped' },
      include: includeRelations,
    });

    await this.receivablesService.createFromSalesOrder(updated);
    return updated;
  }

  async remove(id: string) {
    const order = await this.findById(id);
    if (!order) throw new NotFoundException('销售订单不存在');
    if (order.status !== 'draft') throw new BadRequestException('只能删除草稿订单');

    return this.prisma.salesOrder.delete({ where: { id } });
  }
}
