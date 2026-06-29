import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ServiceTicketsController } from './service-tickets.controller';
import { ServiceTicketsService } from './service-tickets.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ServiceTicketsController],
  providers: [ServiceTicketsService],
})
export class ServiceTicketsModule {}
