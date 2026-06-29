import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { FixedAssetsController } from './fixed-assets.controller';
import { FixedAssetsService } from './fixed-assets.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FixedAssetsController],
  providers: [FixedAssetsService],
})
export class FixedAssetsModule {}
