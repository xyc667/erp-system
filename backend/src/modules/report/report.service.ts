import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { REPORT_FINANCE_CACHE_KEY } from './report-cache.constants';

/** 沈阳区县中心坐标（线索地图气泡） */
const SHENYANG_DISTRICT_CENTROIDS: Record<string, [number, number]> = {
  和平区: [123.406, 41.789],
  沈河区: [123.458, 41.796],
  大东区: [123.469, 41.805],
  皇姑区: [123.425, 41.825],
  铁西区: [123.377, 41.787],
  苏家屯区: [123.344, 41.665],
  浑南区: [123.458, 41.715],
  沈北新区: [123.526, 41.912],
  于洪区: [123.308, 41.793],
  辽中区: [122.731, 41.512],
  新民市: [122.828, 41.996],
  康平县: [123.352, 42.741],
  法库县: [123.408, 42.501],
};

export type BiFeedOrder = {
  id: string;
  orderNo: string;
  type: 'sales' | 'purchase';
  partyName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
};

export type BiFeedEvent = {
  id: string;
  kind: 'sales_order' | 'purchase_order' | 'lead_convert' | 'audit';
  title: string;
  detail: string;
  status?: string;
  amount?: number;
  actor?: string;
  createdAt: string;
};

export type BiFeedMapPoint = {
  name: string;
  district: string | null;
  lng: number;
  lat: number;
  category: string | null;
};

export type BiFeedMapDistrict = {
  district: string;
  count: number;
  lng: number;
  lat: number;
};

export type BiFeed = {
  orders: BiFeedOrder[];
  events: BiFeedEvent[];
  map: {
    districts: BiFeedMapDistrict[];
    points: BiFeedMapPoint[];
  };
};

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

  async getBiFeed(): Promise<BiFeed> {
    const cacheKey = 'report:bi-feed';
    const cached = await this.cache.get<BiFeed>(cacheKey);
    if (cached) return cached;

    const data = await this.buildBiFeed();
    await this.cache.set(cacheKey, data, 30);
    return data;
  }

  private async buildBiFeed(): Promise<BiFeed> {
    const [
      salesOrders,
      purchaseOrders,
      auditLogs,
      convertedLeads,
      districtGroups,
      mapPoints,
    ] = await Promise.all([
      this.prisma.salesOrder.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNo: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          customer: { select: { name: true } },
          createdBy: { select: { name: true } },
        },
      }),
      this.prisma.purchaseOrder.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNo: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          vendor: { select: { name: true } },
          createdBy: { select: { name: true } },
        },
      }),
      this.prisma.auditLog.findMany({
        take: 25,
        orderBy: { createdAt: 'desc' },
        where: { category: 'operation', result: 'SUCCESS' },
        select: {
          id: true,
          action: true,
          resource: true,
          username: true,
          detail: true,
          createdAt: true,
        },
      }),
      this.prisma.leadPool.findMany({
        take: 15,
        where: { convertedAt: { not: null } },
        orderBy: { convertedAt: 'desc' },
        select: {
          id: true,
          name: true,
          district: true,
          convertedAt: true,
          owner: { select: { name: true } },
        },
      }),
      this.prisma.leadPool.groupBy({
        by: ['district'],
        where: { status: 'pool', district: { not: null } },
        _count: true,
      }),
      this.prisma.leadPool.findMany({
        where: { lat: { not: null }, lng: { not: null }, status: 'pool' },
        take: 200,
        select: { name: true, district: true, lng: true, lat: true, category: true },
      }),
    ]);

    const orders: BiFeedOrder[] = [
      ...salesOrders.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        type: 'sales' as const,
        partyName: o.customer.name,
        totalAmount: Number(o.totalAmount),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
      ...purchaseOrders.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        type: 'purchase' as const,
        partyName: o.vendor.name,
        totalAmount: Number(o.totalAmount),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const events: BiFeedEvent[] = [
      ...salesOrders.map((o) => ({
        id: `so-${o.id}`,
        kind: 'sales_order' as const,
        title: o.orderNo,
        detail: o.customer.name,
        status: o.status,
        amount: Number(o.totalAmount),
        actor: o.createdBy.name,
        createdAt: o.createdAt.toISOString(),
      })),
      ...purchaseOrders.map((o) => ({
        id: `po-${o.id}`,
        kind: 'purchase_order' as const,
        title: o.orderNo,
        detail: o.vendor.name,
        status: o.status,
        amount: Number(o.totalAmount),
        actor: o.createdBy.name,
        createdAt: o.createdAt.toISOString(),
      })),
      ...convertedLeads.map((l) => ({
        id: `lc-${l.id}`,
        kind: 'lead_convert' as const,
        title: l.name,
        detail: l.district ?? '',
        actor: l.owner?.name,
        createdAt: (l.convertedAt ?? new Date()).toISOString(),
      })),
      ...auditLogs.map((a) => ({
        id: `au-${a.id}`,
        kind: 'audit' as const,
        title: a.action,
        detail: a.resource ?? '',
        actor: a.username ?? undefined,
        createdAt: a.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);

    const districts: BiFeedMapDistrict[] = districtGroups
      .filter((d) => d.district)
      .map((d) => {
        const name = d.district as string;
        const centroid = SHENYANG_DISTRICT_CENTROIDS[name] ?? [123.43, 41.8];
        return {
          district: name,
          count: d._count,
          lng: centroid[0],
          lat: centroid[1],
        };
      })
      .sort((a, b) => b.count - a.count);

    const points: BiFeedMapPoint[] = mapPoints
      .filter((p) => p.lng != null && p.lat != null)
      .map((p) => ({
        name: p.name,
        district: p.district,
        lng: Number(p.lng),
        lat: Number(p.lat),
        category: p.category,
      }));

    return { orders, events, map: { districts, points } };
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
