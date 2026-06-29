import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogInput {
  category: 'auth' | 'operation' | 'security';
  action: string;
  resource?: string;
  resourceId?: string;
  userId?: string;
  username?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
  result: 'SUCCESS' | 'FAILURE';
  detail?: Record<string, unknown> | string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(input: AuditLogInput) {
    const detail =
      input.detail === undefined
        ? null
        : typeof input.detail === 'string'
          ? input.detail
          : JSON.stringify(input.detail);

    return this.prisma.auditLog.create({
      data: {
        category: input.category,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        userId: input.userId,
        username: input.username,
        role: input.role,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        result: input.result,
        detail,
      },
    });
  }

  async findAll(query: {
    category?: string;
    action?: string;
    username?: string;
    result?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const where: Record<string, unknown> = {};

    if (query.category) where.category = query.category;
    if (query.action) where.action = query.action;
    if (query.username) where.username = { contains: query.username };
    if (query.result) where.result = query.result;
    if (query.startDate || query.endDate) {
      where.createdAt = {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }
}
