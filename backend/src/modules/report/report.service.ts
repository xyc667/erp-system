import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { REPORT_FINANCE_CACHE_KEY } from './report-cache.constants';

@Injectable()
export class ReportService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async getOverview() {
    const cacheKey = 'report:overview';
    const cached = await this.cache.get<Awaited<ReturnType<ReportService['buildOverview']>>>(cacheKey);
    if (cached) return cached;

    const data = await this.buildOverview();
    await this.cache.set(cacheKey, data, 60);
    return data;
  }

  private async buildOverview() {
    const [
      purchaseOrderCount,
      salesOrderCount,
      inventoryAgg,
      userCount,
      employeeCount,
      projectCount,
      salesOrders,
      purchaseOrders,
    ] = await Promise.all([
      this.prisma.purchaseOrder.count(),
      this.prisma.salesOrder.count(),
      this.prisma.inventory.aggregate({ _sum: { quantity: true } }),
      this.prisma.user.count(),
      this.prisma.employee.count(),
      this.prisma.project.count(),
      this.prisma.salesOrder.findMany({
        select: { totalAmount: true, createdAt: true, status: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.purchaseOrder.findMany({
        select: { totalAmount: true, status: true },
      }),
    ]);

    const salesTotal = salesOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const purchaseTotal = purchaseOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    const monthlySales = this.groupByMonth(salesOrders);
    const salesByStatus = this.groupByField(salesOrders, 'status');
    const purchaseByStatus = this.groupByField(purchaseOrders, 'status');

    return {
      stats: {
        salesTotal,
        purchaseOrderCount,
        salesOrderCount,
        inventoryQuantity: Number(inventoryAgg._sum.quantity || 0),
        userCount,
        employeeCount,
        projectCount,
        purchaseTotal,
      },
      charts: {
        monthlySales,
        salesByStatus,
        purchaseByStatus,
      },
    };
  }

  private groupByMonth(orders: { totalAmount: unknown; createdAt: Date }[]) {
    const map = new Map<string, number>();
    for (const order of orders) {
      const month = order.createdAt.toISOString().slice(0, 7);
      map.set(month, (map.get(month) || 0) + Number(order.totalAmount));
    }
    return Array.from(map.entries()).map(([month, amount]) => ({ month, amount }));
  }

  private groupByField<T extends Record<string, unknown>>(items: T[], field: keyof T) {
    const map = new Map<string, number>();
    for (const item of items) {
      const key = String(item[field]);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }

  async getFinanceReport() {
    const cached = await this.cache.get<Awaited<ReturnType<ReportService['buildFinanceReport']>>>(
      REPORT_FINANCE_CACHE_KEY,
    );
    if (cached) return cached;

    const data = await this.buildFinanceReport();
    await this.cache.set(REPORT_FINANCE_CACHE_KEY, data, 120);
    return data;
  }

  invalidateFinanceReportCache() {
    return this.cache.del(REPORT_FINANCE_CACHE_KEY);
  }

  private async buildFinanceReport() {
    const [
      receivables,
      payables,
      fixedAssets,
      postedLines,
      glAccounts,
    ] = await Promise.all([
      this.prisma.accountReceivable.findMany({
        select: { amount: true, receivedAmount: true, status: true },
      }),
      this.prisma.accountPayable.findMany({
        select: { amount: true, paidAmount: true, status: true },
      }),
      this.prisma.fixedAsset.findMany({
        select: {
          originalValue: true,
          accumulatedDepreciation: true,
          status: true,
        },
      }),
      this.prisma.glJournalLine.findMany({
        where: { journal: { status: 'posted' } },
        include: { account: { select: { id: true, code: true, name: true, type: true } } },
      }),
      this.prisma.glAccount.findMany({ orderBy: { code: 'asc' } }),
    ]);

    const arTotal = receivables.reduce((s, r) => s + Number(r.amount), 0);
    const arReceived = receivables.reduce((s, r) => s + Number(r.receivedAmount), 0);
    const apTotal = payables.reduce((s, p) => s + Number(p.amount), 0);
    const apPaid = payables.reduce((s, p) => s + Number(p.paidAmount), 0);

    const assetOriginal = fixedAssets
      .filter((a) => a.status !== 'disposed')
      .reduce((s, a) => s + Number(a.originalValue), 0);
    const assetDepreciation = fixedAssets
      .filter((a) => a.status !== 'disposed')
      .reduce((s, a) => s + Number(a.accumulatedDepreciation), 0);

    const balanceMap = new Map<string, { code: string; name: string; type: string; debit: number; credit: number }>();
    for (const line of postedLines) {
      const key = line.account.id;
      const existing = balanceMap.get(key) ?? {
        code: line.account.code,
        name: line.account.name,
        type: line.account.type,
        debit: 0,
        credit: 0,
      };
      existing.debit += Number(line.debit);
      existing.credit += Number(line.credit);
      balanceMap.set(key, existing);
    }

    const trialBalance = Array.from(balanceMap.values()).map((row) => ({
      ...row,
      balance: row.debit - row.credit,
    }));

    const summaryByType = glAccounts.reduce<Record<string, number>>((acc, account) => {
      const row = trialBalance.find((b) => b.code === account.code);
      acc[account.type] = (acc[account.type] || 0) + (row?.balance ?? 0);
      return acc;
    }, {});

    return {
      receivables: {
        total: arTotal,
        received: arReceived,
        outstanding: arTotal - arReceived,
        openCount: receivables.filter((r) => r.status !== 'paid').length,
      },
      payables: {
        total: apTotal,
        paid: apPaid,
        outstanding: apTotal - apPaid,
        openCount: payables.filter((p) => p.status !== 'paid').length,
      },
      fixedAssets: {
        originalValue: assetOriginal,
        accumulatedDepreciation: assetDepreciation,
        netValue: assetOriginal - assetDepreciation,
        count: fixedAssets.filter((a) => a.status === 'active').length,
      },
      trialBalance,
      summaryByType,
    };
  }
}
