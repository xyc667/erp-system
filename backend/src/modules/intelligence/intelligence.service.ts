import { BadRequestException, Injectable } from '@nestjs/common';
import { TenantService } from '../../common/tenant/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { ReportService } from '../report/report.service';
import { PurchaseRequestsService } from '../purchase-requests/purchase-requests.service';
import { CreateReplenishmentRequestDto } from './dto/create-replenishment-request.dto';

const LEAD_DAYS = 7;

@Injectable()
export class IntelligenceService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
    private inventory: InventoryService,
    private report: ReportService,
    private purchaseRequests: PurchaseRequestsService,
  ) {}

  async getReplenishmentSuggestions() {
    const alerts = await this.inventory.findAlerts();
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const movements = await this.prisma.stockMovement.findMany({
      where: {
        createdAt: { gte: since },
        type: { in: ['sales_out', 'transfer_out', 'adjustment'] },
        quantity: { lt: 0 },
      },
      select: { productId: true, quantity: true },
    });

    const outboundByProduct = new Map<string, number>();
    for (const m of movements) {
      const qty = Math.abs(Number(m.quantity));
      outboundByProduct.set(m.productId, (outboundByProduct.get(m.productId) ?? 0) + qty);
    }

    return alerts.map((alert) => {
      if (!alert) return null;
      const outbound30 = outboundByProduct.get(alert.productId) ?? 0;
      const dailyConsumption = outbound30 / 30;
      const leadTimeDemand = Math.ceil(dailyConsumption * LEAD_DAYS);
      const suggestedQty = Math.max(alert.shortage, leadTimeDemand, 1);
      const coverageDays = dailyConsumption > 0
        ? Math.round((alert.currentQty / dailyConsumption) * 10) / 10
        : null;

      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (alert.currentQty <= alert.safetyStock * 0.5) priority = 'high';
      else if (alert.shortage <= alert.safetyStock * 0.2) priority = 'low';

      return {
        ...alert,
        outbound30,
        dailyConsumption: Math.round(dailyConsumption * 100) / 100,
        suggestedQty,
        coverageDays,
        priority,
        reasonCode: dailyConsumption > 0 ? 'velocity_and_safety' : 'safety_stock_only',
      };
    }).filter(Boolean);
  }

  async createReplenishmentRequest(userId: string, dto: CreateReplenishmentRequestDto) {
    const suggestions = await this.getReplenishmentSuggestions();
    const filtered = dto.productIds?.length
      ? suggestions.filter((s) => s && dto.productIds!.includes(s.productId))
      : suggestions;

    const items = filtered.filter(Boolean).map((s) => ({
      productId: s!.productId,
      quantity: s!.suggestedQty,
    }));

    if (!items.length) {
      throw new BadRequestException('没有可生成采购申请的产品');
    }

    return this.purchaseRequests.create({
      title: '智能补货采购申请',
      reason: '由 AI 智能补货建议自动生成',
      items,
    }, userId);
  }

  async getFinanceInsights() {
    const finance = await this.report.getFinanceReport();
    const overview = await this.report.getOverview();

    const insights: Array<{
      code: string;
      severity: 'info' | 'warning' | 'success';
      params: Record<string, number | string>;
    }> = [];

    const arOutstanding = finance.receivables.outstanding;
    const apOutstanding = finance.payables.outstanding;
    const netPosition = arOutstanding - apOutstanding;

    if (finance.receivables.openCount > 0) {
      insights.push({
        code: 'ar_outstanding',
        severity: arOutstanding > apOutstanding ? 'warning' : 'info',
        params: {
          outstanding: Math.round(arOutstanding * 100) / 100,
          openCount: finance.receivables.openCount,
        },
      });
    }

    if (finance.payables.openCount > 0) {
      insights.push({
        code: 'ap_outstanding',
        severity: apOutstanding > arOutstanding ? 'warning' : 'info',
        params: {
          outstanding: Math.round(apOutstanding * 100) / 100,
          openCount: finance.payables.openCount,
        },
      });
    }

    insights.push({
      code: 'net_cash_position',
      severity: netPosition >= 0 ? 'success' : 'warning',
      params: { net: Math.round(netPosition * 100) / 100 },
    });

    const assetNet = finance.fixedAssets.netValue;
    if (assetNet > 0) {
      insights.push({
        code: 'fixed_asset_net',
        severity: 'info',
        params: {
          netValue: Math.round(assetNet * 100) / 100,
          count: finance.fixedAssets.count,
        },
      });
    }

    const salesTotal = overview.stats.salesTotal;
    const purchaseTotal = overview.stats.purchaseTotal ?? 0;
    if (salesTotal > 0) {
      const marginRatio = (salesTotal - purchaseTotal) / salesTotal;
      insights.push({
        code: 'gross_margin_hint',
        severity: marginRatio < 0.15 ? 'warning' : 'success',
        params: {
          salesTotal: Math.round(salesTotal * 100) / 100,
          purchaseTotal: Math.round(purchaseTotal * 100) / 100,
          marginPct: Math.round(marginRatio * 1000) / 10,
        },
      });
    }

    const liabilityTypes = ['liability', 'payable'];
    const equityTypes = ['equity'];
    const assetBalance = (finance.summaryByType.asset ?? 0);
    const liabilityBalance = liabilityTypes.reduce((s, t) => s + (finance.summaryByType[t] ?? 0), 0);
    const equityBalance = equityTypes.reduce((s, t) => s + (finance.summaryByType[t] ?? 0), 0);

    if (assetBalance !== 0 || liabilityBalance !== 0) {
      insights.push({
        code: 'balance_sheet_snapshot',
        severity: 'info',
        params: {
          assets: Math.round(assetBalance * 100) / 100,
          liabilities: Math.round(Math.abs(liabilityBalance) * 100) / 100,
          equity: Math.round(equityBalance * 100) / 100,
        },
      });
    }

    return { insights, finance, overview: overview.stats };
  }
}
