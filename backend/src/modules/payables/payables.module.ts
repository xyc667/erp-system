import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PayablesController } from './payables.controller';
import { PayablesService } from './payables.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PayablesController],
  providers: [PayablesService],
  exports: [PayablesService],
})
export class PayablesModule {}
