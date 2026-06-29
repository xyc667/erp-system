import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PurchaseRequestsController } from './purchase-requests.controller';
import { PurchaseRequestsService } from './purchase-requests.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PurchaseRequestsController],
  providers: [PurchaseRequestsService],
  exports: [PurchaseRequestsService],
})
export class PurchaseRequestsModule {}
