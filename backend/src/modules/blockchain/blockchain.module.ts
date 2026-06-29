import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';
import { BlockchainRpcService } from './blockchain-rpc.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BlockchainController],
  providers: [BlockchainService, BlockchainRpcService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
