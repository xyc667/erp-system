import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantService } from '../../common/tenant/tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  addProtectionDays,
  buildLeadDedupKey,
  LEAD_CLAIM_LIMIT,
} from './leads.constants';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { CreateContactReportDto } from './dto/create-contact-report.dto';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { ImportLeadItemDto } from './dto/import-leads.dto';
import { InvalidateLeadDto } from './dto/invalidate-lead.dto';
import { QueryContactReportsDto } from './dto/query-contact-reports.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { ReviewContactReportDto } from './dto/review-contact-report.dto';

const QUALITY_BY_INVALID: Record<string, string> = {
  empty_phone: 'empty_phone',
  closed: 'closed',
  not_target: 'not_target',
};

@Injectable()
export class LeadsService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantService,
  ) {}

  private followUpInclude = {
    user: { select: { id: true, name: true } },
    recordingFile: { select: { id: true, fileName: true, mimeType: true } },
    reviewedBy: { select: { id: true, name: true } },
    lead: { select: { id: true, name: true, phone: true, district: true, category: true } },
  } as const;

  onModuleInit() {
    setInterval(() => {
      void this.recycleExpiredLeads();
    }, 60 * 60 * 1000);
  }

  private tenantWhere() {
    return this.tenant.where();
  }

  private async countClaimed(userId: string) {
    return this.prisma.leadPool.count({
      where: { ...this.tenantWhere(), ownerUserId: userId, status: 'claimed' },
    });
  }

  private buildListWhere(query: QueryLeadsDto, base: Prisma.LeadPoolWhereInput) {
    const where: Prisma.LeadPoolWhereInput = { ...base, ...this.tenantWhere() };
    if (query.district) where.district = query.district;
    if (query.category) where.category = query.category;
    if (query.quality) where.quality = query.quality;
    if (query.hasPhone === 'true') where.phone = { not: null };
    if (query.hasPhone === 'false') where.phone = null;
    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword, mode: 'insensitive' } },
        { phone: { contains: query.keyword } },
        { address: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }
    if (query.expiringSoon === 'true') {
      const in3Days = new Date();
      in3Days.setDate(in3Days.getDate() + 3);
      where.expireAt = { lte: in3Days, gte: new Date() };
    }
    return where;
  }

  async findPool(query: QueryLeadsDto) {
    await this.recycleExpiredLeads();
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildListWhere(query, { status: 'pool' });
    const [items, total] = await Promise.all([
      this.prisma.leadPool.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.leadPool.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findMine(userId: string, query: QueryLeadsDto) {
    await this.recycleExpiredLeads();
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildListWhere(query, {
      status: 'claimed',
      ownerUserId: userId,
    });
    const [items, total] = await Promise.all([
      this.prisma.leadPool.findMany({
        where,
        orderBy: [{ expireAt: 'asc' }, { lastFollowAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.leadPool.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async getQuota(userId: string) {
    const claimed = await this.countClaimed(userId);
    return { claimed, limit: LEAD_CLAIM_LIMIT, remaining: LEAD_CLAIM_LIMIT - claimed };
  }

  async findById(id: string) {
    const lead = await this.prisma.leadPool.findFirst({
      where: { id, ...this.tenantWhere() },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            user: { select: { id: true, name: true } },
            recordingFile: { select: { id: true, fileName: true, mimeType: true } },
            reviewedBy: { select: { id: true, name: true } },
          },
        },
        owner: { select: { id: true, name: true } },
      },
    });
    if (!lead) throw new NotFoundException('线索不存在');
    return lead;
  }

  async claim(id: string, userId: string) {
    const claimed = await this.countClaimed(userId);
    if (claimed >= LEAD_CLAIM_LIMIT) {
      throw new BadRequestException(`已达持有上限（${LEAD_CLAIM_LIMIT} 条）`);
    }
    const lead = await this.prisma.leadPool.findFirst({
      where: { id, ...this.tenantWhere(), status: 'pool' },
    });
    if (!lead) throw new NotFoundException('线索不存在或已被领取');
    const now = new Date();
    return this.prisma.leadPool.update({
      where: { id },
      data: {
        status: 'claimed',
        ownerUserId: userId,
        claimedAt: now,
        expireAt: addProtectionDays(now),
      },
    });
  }

  async claimBatch(ids: string[], userId: string) {
    if (ids.length > 10) throw new BadRequestException('单次最多领取 10 条');
    const results: unknown[] = [];
    for (const id of ids) {
      try {
        results.push(await this.claim(id, userId));
      } catch {
        /* skip failed */
      }
    }
    return { claimed: results.length, items: results };
  }

  async release(id: string, userId: string) {
    const lead = await this.prisma.leadPool.findFirst({
      where: { id, ...this.tenantWhere(), status: 'claimed', ownerUserId: userId },
    });
    if (!lead) throw new NotFoundException('线索不存在或无权释放');
    return this.prisma.leadPool.update({
      where: { id },
      data: {
        status: 'pool',
        ownerUserId: null,
        claimedAt: null,
        expireAt: null,
      },
    });
  }

  async addFollowUp(id: string, userId: string, dto: CreateFollowUpDto) {
    const lead = await this.prisma.leadPool.findFirst({
      where: { id, ...this.tenantWhere(), status: 'claimed', ownerUserId: userId },
    });
    if (!lead) throw new NotFoundException('线索不存在或无权跟进');
    const now = new Date();
    const quality = dto.quality ?? lead.quality;
    await this.prisma.$transaction([
      this.prisma.leadFollowUp.create({
        data: {
          leadId: id,
          userId,
          type: dto.type,
          content: dto.content,
          nextActionAt: dto.nextActionAt ? new Date(dto.nextActionAt) : null,
        },
      }),
      this.prisma.leadPool.update({
        where: { id },
        data: {
          followUpCount: { increment: 1 },
          lastFollowAt: now,
          expireAt: addProtectionDays(now),
          quality,
        },
      }),
    ]);
    return this.findById(id);
  }

  async submitContactReport(id: string, userId: string, dto: CreateContactReportDto) {
    const lead = await this.prisma.leadPool.findFirst({
      where: { id, ...this.tenantWhere(), status: 'claimed', ownerUserId: userId },
    });
    if (!lead) throw new NotFoundException('线索不存在或无权上报');
    if (dto.result === 'schedule_next' && !dto.nextActionAt) {
      throw new BadRequestException('约下次联系时必须填写下次联系时间');
    }
    if (dto.recordingFileId) {
      const file = await this.prisma.fileAsset.findFirst({
        where: { id: dto.recordingFileId, ...this.tenant.where() },
      });
      if (!file) throw new BadRequestException('录音文件不存在');
    }
    const now = new Date();
    const quality = dto.quality ?? lead.quality;
    await this.prisma.$transaction([
      this.prisma.leadFollowUp.create({
        data: {
          leadId: id,
          userId,
          type: dto.type,
          content: dto.content,
          result: dto.result,
          isReport: true,
          reviewStatus: 'pending',
          nextActionAt: dto.nextActionAt ? new Date(dto.nextActionAt) : null,
          recordingFileId: dto.recordingFileId ?? null,
        },
      }),
      this.prisma.leadPool.update({
        where: { id },
        data: {
          followUpCount: { increment: 1 },
          lastFollowAt: now,
          expireAt: addProtectionDays(now),
          quality,
        },
      }),
    ]);
    return this.findById(id);
  }

  async listContactReports(query: QueryContactReportsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.LeadFollowUpWhereInput = {
      isReport: true,
      lead: this.tenantWhere(),
    };
    if (query.reviewStatus) where.reviewStatus = query.reviewStatus;
    if (query.userId) where.userId = query.userId;

    const [items, total] = await Promise.all([
      this.prisma.leadFollowUp.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: this.followUpInclude,
      }),
      this.prisma.leadFollowUp.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async reviewContactReport(reportId: string, reviewerId: string, dto: ReviewContactReportDto) {
    const report = await this.prisma.leadFollowUp.findFirst({
      where: {
        id: reportId,
        isReport: true,
        reviewStatus: 'pending',
        lead: this.tenantWhere(),
      },
    });
    if (!report) throw new NotFoundException('上报记录不存在或已审核');
    return this.prisma.leadFollowUp.update({
      where: { id: reportId },
      data: {
        reviewStatus: dto.status,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewComment: dto.comment ?? null,
      },
      include: this.followUpInclude,
    });
  }

  async getContactReportStats() {
    const tenantLeads = this.tenantWhere();
    const reportWhere: Prisma.LeadFollowUpWhereInput = {
      isReport: true,
      lead: tenantLeads,
    };
    const [total, pending, byResult, byUser] = await Promise.all([
      this.prisma.leadFollowUp.count({ where: reportWhere }),
      this.prisma.leadFollowUp.count({ where: { ...reportWhere, reviewStatus: 'pending' } }),
      this.prisma.leadFollowUp.groupBy({
        by: ['result'],
        where: reportWhere,
        _count: true,
      }),
      this.prisma.leadFollowUp.groupBy({
        by: ['userId'],
        where: reportWhere,
        _count: true,
      }),
    ]);

    const userIds = byUser.map((u) => u.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const interested = byResult.find((r) => r.result === 'interested')?._count ?? 0;
    const connected = byResult.find((r) => r.result === 'connected')?._count ?? 0;

    return {
      total,
      pending,
      connectedRate: total ? Math.round((connected / total) * 1000) / 10 : 0,
      interestedRate: total ? Math.round((interested / total) * 1000) / 10 : 0,
      byResult: byResult.map((r) => ({ result: r.result, count: r._count })),
      byUser: byUser
        .map((u) => ({ userId: u.userId, userName: userMap.get(u.userId) ?? '—', count: u._count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  async getRecordingUrl(reportId: string) {
    const report = await this.prisma.leadFollowUp.findFirst({
      where: { id: reportId, isReport: true, lead: this.tenantWhere() },
      include: { recordingFile: true },
    });
    if (!report?.recordingFile) throw new NotFoundException('录音不存在');
    return { fileId: report.recordingFile.id, fileName: report.recordingFile.fileName };
  }

  async listFollowUps(id: string) {
    await this.findById(id);
    return this.prisma.leadFollowUp.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        recordingFile: { select: { id: true, fileName: true, mimeType: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });
  }

  async convert(id: string, userId: string, dto: ConvertLeadDto) {
    const lead = await this.prisma.leadPool.findFirst({
      where: { id, ...this.tenantWhere(), status: 'claimed', ownerUserId: userId },
    });
    if (!lead) throw new NotFoundException('线索不存在或无权转化');
    const tenantId = this.tenant.getTenantId();
    if (!tenantId) throw new BadRequestException('租户上下文缺失');

    const code = dto.code ?? `C${Date.now().toString(36).slice(-8).toUpperCase()}`;
    const existing = await this.prisma.customer.findFirst({
      where: { tenantId, code },
    });
    if (existing) throw new BadRequestException('客户编码已存在');

    const customer = await this.prisma.customer.create({
      data: {
        tenantId,
        code,
        name: dto.name,
        contactName: dto.contactName ?? dto.name,
        contactPhone: dto.contactPhone ?? lead.phone ?? undefined,
        address: dto.address ?? lead.address ?? undefined,
      },
    });

    const now = new Date();
    await this.prisma.leadPool.update({
      where: { id },
      data: {
        status: 'converted',
        convertedCustomerId: customer.id,
        convertedAt: now,
        ownerUserId: null,
        expireAt: null,
      },
    });

    return { lead: await this.findById(id), customer };
  }

  async invalidate(id: string, userId: string, dto: InvalidateLeadDto) {
    const lead = await this.prisma.leadPool.findFirst({
      where: {
        id,
        ...this.tenantWhere(),
        status: { in: ['pool', 'claimed'] },
        OR: [{ status: 'pool' }, { ownerUserId: userId }],
      },
    });
    if (!lead) throw new NotFoundException('线索不存在或无权操作');
    if (lead.status === 'claimed' && lead.ownerUserId !== userId) {
      throw new ForbiddenException('无权标记他人线索');
    }
    return this.prisma.leadPool.update({
      where: { id },
      data: {
        status: 'invalid',
        quality: QUALITY_BY_INVALID[dto.reason] ?? 'not_target',
        invalidReason: dto.reason,
        remark: dto.remark ?? lead.remark,
        ownerUserId: null,
        claimedAt: null,
        expireAt: null,
      },
    });
  }

  async importItems(items: ImportLeadItemDto[]) {
    const tenantId = this.tenant.getTenantId();
    if (!tenantId) throw new BadRequestException('租户上下文缺失');

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        const source = item.source ?? 'manual';
        const dedupKey =
          item.sourceId && source !== 'manual'
            ? buildLeadDedupKey(item.name, item.sourceId, source)
            : buildLeadDedupKey(item.name, item.phone, item.district);

        const existing = await this.prisma.leadPool.findFirst({
          where: { tenantId, dedupKey },
        });
        if (existing) {
          skipped++;
          continue;
        }

        await this.prisma.leadPool.create({
          data: {
            tenantId,
            name: item.name,
            phone: item.phone,
            phoneBackup: item.phoneBackup,
            address: item.address,
            district: item.district,
            category: item.category,
            poiCategoryRaw: item.poiCategoryRaw,
            lng: item.lng,
            lat: item.lat,
            source,
            sourceId: item.sourceId,
            dedupKey,
            status: 'pool',
            quality: 'unknown',
            remark: item.remark,
          },
        });
        created++;
      } catch (e) {
        errors.push(`${item.name}: ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }

    return { created, skipped, failed: errors.length, errors: errors.slice(0, 20) };
  }

  async getStats() {
    const base = this.tenantWhere();
    const [pool, claimed, converted, invalid, byDistrict, byCategory] = await Promise.all([
      this.prisma.leadPool.count({ where: { ...base, status: 'pool' } }),
      this.prisma.leadPool.count({ where: { ...base, status: 'claimed' } }),
      this.prisma.leadPool.count({ where: { ...base, status: 'converted' } }),
      this.prisma.leadPool.count({ where: { ...base, status: 'invalid' } }),
      this.prisma.leadPool.groupBy({
        by: ['district'],
        where: { ...base, status: 'pool' },
        _count: true,
      }),
      this.prisma.leadPool.groupBy({
        by: ['category'],
        where: { ...base, status: 'pool' },
        _count: true,
      }),
    ]);
    return {
      pool,
      claimed,
      converted,
      invalid,
      byDistrict: byDistrict.map((d) => ({ district: d.district, count: d._count })),
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count })),
    };
  }

  async recycleExpiredLeads() {
    const now = new Date();
    const expired = await this.prisma.leadPool.findMany({
      where: {
        status: 'claimed',
        expireAt: { lt: now },
      },
      select: { id: true, claimedAt: true, lastFollowAt: true },
    });

    const toRecycle = expired.filter((lead) => {
      if (!lead.lastFollowAt || !lead.claimedAt) return true;
      return lead.lastFollowAt.getTime() <= lead.claimedAt.getTime();
    });

    if (toRecycle.length === 0) return { recycled: 0 };

    await this.prisma.leadPool.updateMany({
      where: { id: { in: toRecycle.map((l) => l.id) } },
      data: {
        status: 'pool',
        ownerUserId: null,
        claimedAt: null,
        expireAt: null,
      },
    });

    return { recycled: toRecycle.length };
  }
}
