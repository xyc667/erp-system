import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { FilesService } from '../storage/files.service';
import { AUDIO_MIME_TYPES } from './leads.constants';
import { ClaimBatchDto, ImportLeadsDto } from './dto/import-leads.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { CreateContactReportDto } from './dto/create-contact-report.dto';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { InvalidateLeadDto } from './dto/invalidate-lead.dto';
import { QueryContactReportsDto } from './dto/query-contact-reports.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { ReviewContactReportDto } from './dto/review-contact-report.dto';
import { LeadsService } from './leads.service';

@Controller('api/leads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeadsController {
  constructor(
    private leadsService: LeadsService,
    private filesService: FilesService,
  ) {}

  @Get('pool')
  @RequirePermissions('lead:view')
  findPool(@Query() query: QueryLeadsDto) {
    return this.leadsService.findPool(query);
  }

  @Get('mine')
  @RequirePermissions('lead:view')
  findMine(@Query() query: QueryLeadsDto, @Request() req: { user: { userId: string } }) {
    return this.leadsService.findMine(req.user.userId, query);
  }

  @Get('stats')
  @RequirePermissions('lead:view', 'lead:manage')
  getStats() {
    return this.leadsService.getStats();
  }

  @Get('contact-reports/stats')
  @RequirePermissions('lead:review', 'lead:manage')
  getContactReportStats() {
    return this.leadsService.getContactReportStats();
  }

  @Get('contact-reports/mine')
  @RequirePermissions('lead:report')
  listMyContactReports(
    @Query() query: QueryContactReportsDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.leadsService.listMyContactReports(req.user.userId, query);
  }

  @Get('contact-reports')
  @RequirePermissions('lead:review', 'lead:manage')
  listContactReports(@Query() query: QueryContactReportsDto) {
    return this.leadsService.listContactReports(query);
  }

  @Get('quota')
  @RequirePermissions('lead:view')
  getQuota(@Request() req: { user: { userId: string } }) {
    return this.leadsService.getQuota(req.user.userId);
  }

  @Post('import')
  @RequirePermissions('lead:import')
  import(@Body() dto: ImportLeadsDto) {
    return this.leadsService.importItems(dto.items);
  }

  @Post('claim-batch')
  @RequirePermissions('lead:claim')
  claimBatch(@Body() dto: ClaimBatchDto, @Request() req: { user: { userId: string } }) {
    return this.leadsService.claimBatch(dto.ids, req.user.userId);
  }

  @Post('upload-recording')
  @RequirePermissions('lead:report')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadRecording(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: { userId: string; tenantId: string } },
  ) {
    if (!file) throw new BadRequestException('请选择录音文件');
    if (!AUDIO_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('仅支持 mp3/m4a/wav 等音频格式');
    }
    return this.filesService.upload(file, req.user.userId, req.user.tenantId);
  }

  @Post('contact-reports/:reportId/review')
  @RequirePermissions('lead:review')
  reviewContactReport(
    @Param('reportId') reportId: string,
    @Body() dto: ReviewContactReportDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.leadsService.reviewContactReport(reportId, req.user.userId, dto);
  }

  @Get('contact-reports/:reportId/recording-url')
  @RequirePermissions('lead:view', 'lead:review')
  async getRecordingUrl(@Param('reportId') reportId: string) {
    const meta = await this.leadsService.getRecordingUrl(reportId);
    return this.filesService.getDownloadUrl(meta.fileId);
  }

  @Get(':id/follow-ups')
  @RequirePermissions('lead:view')
  listFollowUps(@Param('id') id: string) {
    return this.leadsService.listFollowUps(id);
  }

  @Get(':id')
  @RequirePermissions('lead:view')
  findById(@Param('id') id: string) {
    return this.leadsService.findById(id);
  }

  @Post(':id/claim')
  @RequirePermissions('lead:claim')
  claim(@Param('id') id: string, @Request() req: { user: { userId: string } }) {
    return this.leadsService.claim(id, req.user.userId);
  }

  @Post(':id/release')
  @RequirePermissions('lead:claim')
  release(@Param('id') id: string, @Request() req: { user: { userId: string } }) {
    return this.leadsService.release(id, req.user.userId);
  }

  @Post(':id/follow-ups')
  @RequirePermissions('lead:follow')
  addFollowUp(
    @Param('id') id: string,
    @Body() dto: CreateFollowUpDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.leadsService.addFollowUp(id, req.user.userId, dto);
  }

  @Post(':id/contact-reports')
  @RequirePermissions('lead:report')
  submitContactReport(
    @Param('id') id: string,
    @Body() dto: CreateContactReportDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.leadsService.submitContactReport(id, req.user.userId, dto);
  }

  @Post(':id/convert')
  @RequirePermissions('lead:convert', 'sales:customer')
  convert(
    @Param('id') id: string,
    @Body() dto: ConvertLeadDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.leadsService.convert(id, req.user.userId, dto);
  }

  @Post(':id/invalidate')
  @RequirePermissions('lead:invalidate')
  invalidate(
    @Param('id') id: string,
    @Body() dto: InvalidateLeadDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.leadsService.invalidate(id, req.user.userId, dto);
  }
}
