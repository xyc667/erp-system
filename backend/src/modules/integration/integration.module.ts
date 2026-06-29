import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [IntegrationController],
  providers: [IntegrationService],
})
export class IntegrationModule {}
