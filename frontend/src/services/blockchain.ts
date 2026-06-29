import api from './api'

export interface ChainAnchor {
  id: string
  anchorType: string
  referenceKey: string
  payloadHash: string
  prevHash: string | null
  blockIndex: number
  txHash?: string | null
  network?: string | null
  chainMode?: 'local' | 'rpc' | null
  createdAt: string
}

export interface BlockchainStatus {
  rpcEnabled: boolean
  network: string | null
  rpcUrl: string | null
}

export interface VerifyResult {
  verified: boolean
  chainValid?: boolean
  dataIntact?: boolean
  reason?: string
  blockCount?: number
  latestBlock?: ChainAnchor
  anchors?: ChainAnchor[]
  rpcEnabled?: boolean
  onChainTx?: string | null
}

export const blockchainService = {
  getStatus: () => api.get<BlockchainStatus>('/blockchain/status'),
  anchorBatch: (batchNo: string) => api.post<ChainAnchor>(`/blockchain/anchor/batch/${encodeURIComponent(batchNo)}`),
  verifyBatch: (batchNo: string) => api.get<VerifyResult>(`/blockchain/verify/batch/${encodeURIComponent(batchNo)}`),
  listChain: (limit = 20) => api.get<ChainAnchor[]>(`/blockchain/chain?limit=${limit}`),
}
