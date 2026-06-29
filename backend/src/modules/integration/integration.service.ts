import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IntegrationService {
  constructor(private prisma: PrismaService) {}

  async exportMasterData() {
    const [products, customers, vendors, warehouses] = await Promise.all([
      this.prisma.product.findMany({
        select: { id: true, code: true, name: true, unit: true, price: true, safetyStock: true },
      }),
      this.prisma.customer.findMany({
        select: { id: true, code: true, name: true, contactPhone: true, creditLimit: true, status: true },
      }),
      this.prisma.vendor.findMany({
        select: { id: true, code: true, name: true, contactPhone: true, status: true },
      }),
      this.prisma.warehouse.findMany({
        select: { id: true, code: true, name: true, address: true, status: true },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      products,
      customers,
      vendors,
      warehouses,
    };
  }

  async exportOrders(type?: 'sales' | 'purchase') {
    const [salesOrders, purchaseOrders] = await Promise.all([
      !type || type === 'sales'
        ? this.prisma.salesOrder.findMany({
            include: {
              customer: { select: { code: true, name: true } },
              items: { include: { product: { select: { code: true, name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],
      !type || type === 'purchase'
        ? this.prisma.purchaseOrder.findMany({
            include: {
              vendor: { select: { code: true, name: true } },
              items: { include: { product: { select: { code: true, name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
          })
        : [],
    ]);

    return {
      exportedAt: new Date().toISOString(),
      salesOrders,
      purchaseOrders,
    };
  }

  async exportInventory() {
    const inventory = await this.prisma.inventory.findMany({
      include: {
        product: { select: { code: true, name: true, unit: true } },
        warehouse: { select: { code: true, name: true } },
      },
    });

    return { exportedAt: new Date().toISOString(), inventory };
  }
}
