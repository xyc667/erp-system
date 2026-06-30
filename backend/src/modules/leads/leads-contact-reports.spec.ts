import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantService } from '../../common/tenant/tenant.service';

describe('LeadsService contact reports', () => {
  const tenantWhere = { tenantId: 'tenant-1' };
  const leadId = 'lead-1';
  const userId = 'user-1';
  const reviewerId = 'reviewer-1';

  const prisma = {
    leadPool: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    fileAsset: {
      findFirst: jest.fn(),
    },
    leadFollowUp: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  } as unknown as PrismaService;

  const tenant = {
    where: jest.fn(() => tenantWhere),
  } as unknown as TenantService;

  const service = new LeadsService(prisma, tenant);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitContactReport', () => {
    const dto = {
      type: 'call',
      result: 'connected',
      content: '客户有意向',
    };

    it('throws when lead is missing or not owned', async () => {
      jest.spyOn(prisma.leadPool, 'findFirst').mockResolvedValue(null);
      await expect(service.submitContactReport(leadId, userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('requires nextActionAt for schedule_next', async () => {
      jest.spyOn(prisma.leadPool, 'findFirst').mockResolvedValue({ id: leadId } as never);
      await expect(
        service.submitContactReport(leadId, userId, { ...dto, result: 'schedule_next' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects missing recording file', async () => {
      jest.spyOn(prisma.leadPool, 'findFirst').mockResolvedValue({ id: leadId } as never);
      jest.spyOn(prisma.fileAsset, 'findFirst').mockResolvedValue(null);
      await expect(
        service.submitContactReport(leadId, userId, { ...dto, recordingFileId: 'file-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates pending report and increments follow-up count', async () => {
      jest.spyOn(prisma.leadPool, 'findFirst').mockResolvedValue({
        id: leadId,
        quality: 'valid',
      } as never);
      jest.spyOn(prisma.leadFollowUp, 'create').mockResolvedValue({ id: 'report-1' } as never);
      jest.spyOn(prisma.leadPool, 'update').mockResolvedValue({ id: leadId } as never);
      jest.spyOn(service, 'findById').mockResolvedValue({ id: leadId } as never);

      await service.submitContactReport(leadId, userId, dto);

      expect(prisma.leadFollowUp.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadId,
            userId,
            isReport: true,
            reviewStatus: 'pending',
            result: 'connected',
          }),
        }),
      );
      expect(prisma.leadPool.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: leadId },
          data: expect.objectContaining({ followUpCount: { increment: 1 } }),
        }),
      );
    });
  });

  describe('listContactReports', () => {
    it('filters by review status', async () => {
      jest.spyOn(prisma.leadFollowUp, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.leadFollowUp, 'count').mockResolvedValue(0);

      await service.listContactReports({ reviewStatus: 'pending', page: 1, pageSize: 20 });

      expect(prisma.leadFollowUp.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isReport: true,
            reviewStatus: 'pending',
            lead: tenantWhere,
          }),
        }),
      );
    });
  });

  describe('reviewContactReport', () => {
    it('throws when report is not pending', async () => {
      jest.spyOn(prisma.leadFollowUp, 'findFirst').mockResolvedValue(null);
      await expect(
        service.reviewContactReport('report-1', reviewerId, { status: 'approved' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates review fields', async () => {
      jest.spyOn(prisma.leadFollowUp, 'findFirst').mockResolvedValue({ id: 'report-1' } as never);
      jest.spyOn(prisma.leadFollowUp, 'update').mockResolvedValue({
        id: 'report-1',
        reviewStatus: 'approved',
      } as never);

      const result = await service.reviewContactReport('report-1', reviewerId, {
        status: 'approved',
        comment: 'OK',
      });

      expect(prisma.leadFollowUp.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'report-1' },
          data: expect.objectContaining({
            reviewStatus: 'approved',
            reviewedById: reviewerId,
            reviewComment: 'OK',
          }),
        }),
      );
      expect(result.reviewStatus).toBe('approved');
    });
  });

  describe('getContactReportStats', () => {
    it('computes rates from grouped results', async () => {
      jest
        .spyOn(prisma.leadFollowUp, 'count')
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(1);
      (prisma.leadFollowUp.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { result: 'connected', _count: 2 },
          { result: 'interested', _count: 1 },
        ])
        .mockResolvedValueOnce([{ userId: 'u1', _count: 4 }]);
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue([{ id: 'u1', name: '陈销售' }] as never);

      const stats = await service.getContactReportStats();

      expect(stats.total).toBe(4);
      expect(stats.pending).toBe(1);
      expect(stats.connectedRate).toBe(50);
      expect(stats.interestedRate).toBe(25);
      expect(stats.byUser[0]).toEqual({ userId: 'u1', userName: '陈销售', count: 4 });
    });
  });

  describe('getRecordingUrl', () => {
    it('throws when report has no recording', async () => {
      jest.spyOn(prisma.leadFollowUp, 'findFirst').mockResolvedValue({ id: 'report-1' } as never);
      await expect(service.getRecordingUrl('report-1')).rejects.toThrow(NotFoundException);
    });

    it('returns file metadata when recording exists', async () => {
      jest.spyOn(prisma.leadFollowUp, 'findFirst').mockResolvedValue({
        id: 'report-1',
        recordingFile: { id: 'file-1', fileName: 'call.wav' },
      } as never);

      const meta = await service.getRecordingUrl('report-1');
      expect(meta).toEqual({ fileId: 'file-1', fileName: 'call.wav' });
    });
  });
});
