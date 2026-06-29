import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOrderNo } from '../../common/utils/order-no';
import { CreateSalesQuoteDto } from './dto/create-sales-quote.dto';

const includeRelations = {
  customer: true,
  createdBy: { select: { id: true, name: true } },
  items: { include: { product: true } },
  salesOrder: { select: { id: true, orderNo: true } },
};

@Injectable()
export class SalesQuotesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.salesQuote.findMany({
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.salesQuote.findUnique({
      where: { id },
      include: includeRelations,
    });
  }

  async create(dto: CreateSalesQuoteDto, userId: string) {
    if (!dto.items?.length) throw new BadRequestException('报价明细不能为空');

    const quoteNo = await generateOrderNo('SQ', async () => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return this.prisma.salesQuote.count({
        where: { quoteNo: { startsWith: `SQ-${date}` } },
      });
    });

    const items = dto.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
    }));
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    return this.prisma.salesQuote.create({
      data: {
        quoteNo,
        customerId: dto.customerId,
        totalAmount,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        createdById: userId,
        items: { create: items },
      },
      include: includeRelations,
    });
  }

  async approve(id: string) {
    const quote = await this.findById(id);
    if (!quote) throw new NotFoundException('销售报价不存在');
    if (quote.status !== 'draft') throw new BadRequestException('只能审批草稿报价');

    return this.prisma.salesQuote.update({
      where: { id },
      data: { status: 'approved' },
      include: includeRelations,
    });
  }

  async convertToOrder(id: string, userId: string) {
    const quote = await this.findById(id);
    if (!quote) throw new NotFoundException('销售报价不存在');
    if (quote.status !== 'approved') throw new BadRequestException('只能转换已审批报价');
    if (quote.salesOrder) throw new BadRequestException('已生成销售订单');

    const orderNo = await generateOrderNo('SO', async () => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return this.prisma.salesOrder.count({
        where: { orderNo: { startsWith: `SO-${date}` } },
      });
    });

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.create({
        data: {
          orderNo,
          customerId: quote.customerId,
          totalAmount: quote.totalAmount,
          createdById: userId,
          salesQuoteId: id,
          items: {
            create: quote.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            })),
          },
        },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      await tx.salesQuote.update({
        where: { id },
        data: { status: 'converted' },
      });

      return order;
    });
  }

  async remove(id: string) {
    const quote = await this.findById(id);
    if (!quote) throw new NotFoundException('销售报价不存在');
    if (quote.status !== 'draft') throw new BadRequestException('只能删除草稿报价');

    return this.prisma.salesQuote.delete({ where: { id } });
  }
}
