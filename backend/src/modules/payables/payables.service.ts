import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOrderNo } from '../../common/utils/order-no';
import { RecordPaymentDto } from './dto/record-payment.dto';

const includeRelations = {
  vendor: true,
  purchaseOrder: { select: { id: true, orderNo: true } },
};

@Injectable()
export class PayablesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.accountPayable.findMany({
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.accountPayable.findUnique({
      where: { id },
      include: includeRelations,
    });
  }

  async createFromPurchaseOrder(order: {
    id: string;
    orderNo: string;
    vendorId: string;
    totalAmount: { toString(): string } | number;
  }) {
    const existing = await this.prisma.accountPayable.findFirst({
      where: { purchaseOrderId: order.id },
    });
    if (existing) return existing;

    const billNo = await generateOrderNo('AP', async () => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return this.prisma.accountPayable.count({
        where: { billNo: { startsWith: `AP-${date}` } },
      });
    });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    return this.prisma.accountPayable.create({
      data: {
        billNo,
        vendorId: order.vendorId,
        purchaseOrderId: order.id,
        amount: Number(order.totalAmount),
        dueDate,
      },
      include: includeRelations,
    });
  }

  async recordPayment(id: string, dto: RecordPaymentDto) {
    const bill = await this.findById(id);
    if (!bill) throw new NotFoundException('应付单不存在');

    const paidAmount = Number(bill.paidAmount) + dto.amount;
    const amount = Number(bill.amount);
    if (paidAmount > amount) throw new BadRequestException('付款金额超过应付余额');

    let status = 'partial';
    if (paidAmount >= amount) status = 'paid';
    else if (paidAmount === 0) status = 'open';

    return this.prisma.accountPayable.update({
      where: { id },
      data: { paidAmount, status },
      include: includeRelations,
    });
  }
}
