import api from './api'

export interface GlAccount {
  id: string
  code: string
  name: string
  type: string
  parentId: string | null
  description: string | null
}

export interface GlJournalLine {
  id: string
  accountId: string
  debit: number
  credit: number
  description: string | null
  account: GlAccount
}

export interface GlJournal {
  id: string
  journalNo: string
  date: string
  type: string
  status: string
  lines: GlJournalLine[]
}

export const financeService = {
  getAccounts: () => api.get<GlAccount[]>('/finance/accounts'),
  createAccount: (data: Partial<GlAccount>) => api.post<GlAccount>('/finance/accounts', data),
  deleteAccount: (id: string) => api.delete(`/finance/accounts/${id}`),
  getJournals: () => api.get<GlJournal[]>('/finance/journals'),
  createJournal: (data: {
    date: string
    type: string
    lines: { accountId: string; debit: number; credit: number; description?: string }[]
  }) => api.post<GlJournal>('/finance/journals', data),
  approveJournal: (id: string) => api.post(`/finance/journals/${id}/approve`),
  deleteJournal: (id: string) => api.delete(`/finance/journals/${id}`),
}
