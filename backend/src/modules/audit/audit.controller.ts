import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { AuditService } from './audit.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@Controller('api/system/audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @RequirePermissions('system:audit')
  findAll(@Query() query: QueryAuditLogsDto) {
    return this.auditService.findAll(query);
  }
}
