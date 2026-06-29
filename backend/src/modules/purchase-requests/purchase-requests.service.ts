import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOrderNo } from '../../common/utils/order-no';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { ConvertPurchaseRequestDto } from './dto/create-purchase-request.dto';

const includeRelations = {
  createdBy: { select: { id: true, name: true } },
  approvedBy: { select: { id: true, name: true } },
  items: { include: { product: true } },
  purchaseOrder: { select: { id: true, orderNo: true } },
};

@Injectable()
export class PurchaseRequestsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.purchaseRequest.findMany({
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.purchaseRequest.findUnique({
      where: { id },
      include: includeRelations,
    });
  }

  async create(dto: CreatePurchaseRequestDto, userId: string) {
    if (!dto.items?.length) throw new BadRequestException('申请明细不能为空');

    const requestNo = await generateOrderNo('PR', async () => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return this.prisma.purchaseRequest.count({
        where: { requestNo: { startsWith: `PR-${date}` } },
      });
    });

    return this.prisma.purchaseRequest.create({
      data: {
        requestNo,
        title: dto.title,
        reason: dto.reason,
        createdById: userId,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            estimatedPrice: item.estimatedPrice,
          })),
        },
      },
      include: includeRelations,
    });
  }

  async approve(id: string, userId: string) {
    const request = await this.findById(id);
    if (!request) throw new NotFoundException('采购申请不存在');
    if (request.status !== 'draft') throw new BadRequestException('只能审批草稿申请');

    return this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: 'approved',
        approvedById: userId,
        approvedAt: new Date(),
      },
      include: includeRelations,
    });
  }

  async convertToOrder(id: string, dto: ConvertPurchaseRequestDto, userId: string) {
    const request = await this.findById(id);
    if (!request) throw new NotFoundException('采购申请不存在');
    if (request.status !== 'approved') throw new BadRequestException('只能转换已审批申请');
    if (request.purchaseOrder) throw new BadRequestException('已生成采购订单');

    const orderNo = await generateOrderNo('PO', async () => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return this.prisma.purchaseOrder.count({
        where: { orderNo: { startsWith: `PO-${date}` } },
      });
    });

    const items = request.items.map((item) => {
      const unitPrice = Number(item.estimatedPrice ?? item.product.price ?? 0);
      const quantity = Number(item.quantity);
      return {
        productId: item.productId,
        quantity,
        unitPrice,
        amount: quantity * unitPrice,
      };
    });
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.create({
        data: {
          orderNo,
          vendorId: dto.vendorId,
          totalAmount,
          createdById: userId,
          purchaseRequestId: id,
          items: { create: items },
        },
        include: {
          vendor: true,
          items: { include: { product: true } },
        },
      });

      await tx.purchaseRequest.update({
        where: { id },
        data: { status: 'converted' },
      });

      return order;
    });
  }

  async remove(id: string) {
    const request = await this.findById(id);
    if (!request) throw new NotFoundException('采购申请不存在');
    if (request.status !== 'draft') throw new BadRequestException('只能删除草稿申请');

    return this.prisma.purchaseRequest.delete({ where: { id } });
  }
}
