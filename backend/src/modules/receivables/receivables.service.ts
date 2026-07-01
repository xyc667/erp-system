import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOrderNo } from '../../common/utils/order-no';
import { ReportService } from '../report/report.service';
import { RecordReceiptDto } from './dto/record-receipt.dto';

const includeRelations = {
  customer: true,
  salesOrder: { select: { id: true, orderNo: true } },
};

@Injectable()
export class ReceivablesService {
  constructor(
    private prisma: PrismaService,
    private reportService: ReportService,
  ) {}

  findAll() {
    return this.prisma.accountReceivable.findMany({
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.accountReceivable.findUnique({
      where: { id },
      include: includeRelations,
    });
  }

  async createFromSalesOrder(order: {
    id: string;
    orderNo: string;
    customerId: string;
    totalAmount: { toString(): string } | number;
  }) {
    const existing = await this.prisma.accountReceivable.findFirst({
      where: { salesOrderId: order.id },
    });
    if (existing) return existing;

    const billNo = await generateOrderNo('AR', async () => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return this.prisma.accountReceivable.count({
        where: { billNo: { startsWith: `AR-${date}` } },
      });
    });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const created = await this.prisma.accountReceivable.create({
      data: {
        billNo,
        customerId: order.customerId,
        salesOrderId: order.id,
        amount: Number(order.totalAmount),
        dueDate,
      },
      include: includeRelations,
    });
    await this.reportService.invalidateFinanceReportCache();
    return created;
  }

  async recordReceipt(id: string, dto: RecordReceiptDto) {
    const bill = await this.findById(id);
    if (!bill) throw new NotFoundException('应收单不存在');

    const receivedAmount = Number(bill.receivedAmount) + dto.amount;
    const amount = Number(bill.amount);
    if (receivedAmount > amount) throw new BadRequestException('收款金额超过应收余额');

    let status = 'partial';
    if (receivedAmount >= amount) status = 'paid';
    else if (receivedAmount === 0) status = 'open';

    const updated = await this.prisma.accountReceivable.update({
      where: { id },
      data: { receivedAmount, status },
      include: includeRelations,
    });
    await this.reportService.invalidateFinanceReportCache();
    return updated;
  }
}
