import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { SalesQuotesController } from './sales-quotes.controller';
import { SalesQuotesService } from './sales-quotes.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SalesQuotesController],
  providers: [SalesQuotesService],
})
export class SalesQuotesModule {}
