import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ReportModule } from '../report/report.module';
import { PurchaseRequestsModule } from '../purchase-requests/purchase-requests.module';
import { IntelligenceController } from './intelligence.controller';
import { IntelligenceService } from './intelligence.service';

@Module({
  imports: [PrismaModule, AuthModule, InventoryModule, ReportModule, PurchaseRequestsModule],
  controllers: [IntelligenceController],
  providers: [IntelligenceService],
})
export class IntelligenceModule {}
