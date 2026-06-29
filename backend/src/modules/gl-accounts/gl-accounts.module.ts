import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { GlAccountsController } from './gl-accounts.controller';
import { GlAccountsService } from './gl-accounts.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [GlAccountsController],
  providers: [GlAccountsService],
  exports: [GlAccountsService],
})
export class GlAccountsModule {}
