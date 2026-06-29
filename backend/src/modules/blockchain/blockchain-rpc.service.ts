import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonRpcProvider, Wallet, hexlify, toUtf8Bytes } from 'ethers';

export interface ChainSubmitResult {
  txHash?: string;
  network?: string;
  chainMode: 'local' | 'rpc';
}

@Injectable()
export class BlockchainRpcService {
  private readonly logger = new Logger(BlockchainRpcService.name);

  constructor(private config: ConfigService) {}

  async submitHash(payloadHash: string): Promise<ChainSubmitResult> {
    const rpcUrl = this.config.get<string>('BLOCKCHAIN_RPC_URL');
    const privateKey = this.config.get<string>('BLOCKCHAIN_PRIVATE_KEY');
    const network = this.config.get<string>('BLOCKCHAIN_NETWORK_NAME') || 'ethereum';

    if (!rpcUrl || !privateKey) {
      return { chainMode: 'local' };
    }

    try {
      const provider = new JsonRpcProvider(rpcUrl);
      const wallet = new Wallet(privateKey, provider);
      const data = hexlify(toUtf8Bytes(`erp-anchor:${payloadHash}`));

      const tx = await wallet.sendTransaction({
        to: wallet.address,
        value: 0,
        data,
      });

      const receipt = await tx.wait();
      return {
        txHash: receipt?.hash ?? tx.hash,
        network,
        chainMode: 'rpc',
      };
    } catch (error) {
      this.logger.warn(`Blockchain RPC submit failed: ${(error as Error).message}`);
      return { chainMode: 'local' };
    }
  }

  isRpcEnabled(): boolean {
    return Boolean(
      this.config.get<string>('BLOCKCHAIN_RPC_URL')
      && this.config.get<string>('BLOCKCHAIN_PRIVATE_KEY'),
    );
  }
}
