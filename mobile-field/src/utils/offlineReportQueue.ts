import AsyncStorage from '@react-native-async-storage/async-storage'
import type { SubmitContactReportPayload } from '../types/api'

const QUEUE_KEY = 'erp-field-offline-report-queue'

export type PendingReport = {
  id: string
  leadId: string
  leadName: string
  payload: SubmitContactReportPayload
  audioUri?: string
  audioName?: string
  audioMime?: string
  createdAt: string
}

async function readQueue(): Promise<PendingReport[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as PendingReport[]
  } catch {
    return []
  }
}

async function writeQueue(items: PendingReport[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items))
}

export async function getPendingReports() {
  return readQueue()
}

export async function enqueueReport(item: Omit<PendingReport, 'id' | 'createdAt'>) {
  const queue = await readQueue()
  queue.push({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  })
  await writeQueue(queue)
  return queue.length
}

export async function removePendingReport(id: string) {
  const queue = await readQueue()
  await writeQueue(queue.filter((q) => q.id !== id))
}

export async function clearPendingReports() {
  await AsyncStorage.removeItem(QUEUE_KEY)
}
