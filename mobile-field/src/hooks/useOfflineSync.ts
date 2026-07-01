import { useEffect } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { Alert } from 'react-native'
import { submitContactReport, uploadRecording } from '../api/leads'
import {
  getPendingReports,
  removePendingReport,
} from '../utils/offlineReportQueue'

async function flushOfflineReports(silent: boolean) {
  const queue = await getPendingReports()
  if (queue.length === 0) return

  let synced = 0
  for (const item of queue) {
    try {
      let recordingFileId: string | undefined
      if (item.audioUri && item.audioName) {
        const uploaded = await uploadRecording(
          item.audioUri,
          item.audioName,
          item.audioMime ?? 'audio/mp4',
        )
        recordingFileId = uploaded.id
      }
      await submitContactReport(item.leadId, {
        ...item.payload,
        recordingFileId,
      })
      await removePendingReport(item.id)
      synced += 1
    } catch {
      break
    }
  }

  if (synced > 0 && !silent) {
    Alert.alert('离线同步', `已提交 ${synced} 条暂存上报`)
  }
}

export function useOfflineSync() {
  useEffect(() => {
    void flushOfflineReports(true)

    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected !== false) {
        void flushOfflineReports(false)
      }
    })

    return () => unsub()
  }, [])
}
