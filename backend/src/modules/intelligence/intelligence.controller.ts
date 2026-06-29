import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateReplenishmentRequestDto } from './dto/create-replenishment-request.dto';
import { IntelligenceService } from './intelligence.service';

@Controller('api/intelligence')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class IntelligenceController {
  constructor(private intelligenceService: IntelligenceService) {}

  @Get('replenishment')
  @RequirePermissions('inventory:alert', 'report:center')
  getReplenishment() {
    return this.intelligenceService.getReplenishmentSuggestions();
  }

  @Post('replenishment/create-request')
  @RequirePermissions('procurement:request', 'inventory:alert')
  createReplenishmentRequest(
    @Body() dto: CreateReplenishmentRequestDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.intelligenceService.createReplenishmentRequest(req.user.userId, dto);
  }

  @Get('finance')
  @RequirePermissions('finance:report', 'report:center')
  getFinanceInsights() {
    return this.intelligenceService.getFinanceInsights();
  }
}
