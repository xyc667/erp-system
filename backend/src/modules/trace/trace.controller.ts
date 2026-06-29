import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { RegisterSerialDto } from './dto/register-serial.dto';
import { TraceService } from './trace.service';

@Controller('api/inventory/trace')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TraceController {
  constructor(private traceService: TraceService) {}

  @Get('serials')
  @RequirePermissions('inventory:trace', 'inventory:stock')
  listSerials() {
    return this.traceService.listSerials();
  }

  @Get('batch/:batchNo')
  @RequirePermissions('inventory:trace', 'inventory:stock')
  traceBatch(@Param('batchNo') batchNo: string) {
    return this.traceService.traceByBatch(batchNo);
  }

  @Get('serial/:serialNo')
  @RequirePermissions('inventory:trace', 'inventory:stock')
  traceSerial(@Param('serialNo') serialNo: string) {
    return this.traceService.traceBySerial(serialNo);
  }

  @Post('serials')
  @RequirePermissions('inventory:trace', 'inventory:inout')
  registerSerial(@Body() dto: RegisterSerialDto, @Request() req: { user: { userId: string } }) {
    return this.traceService.registerSerial(dto, req.user.userId);
  }
}
