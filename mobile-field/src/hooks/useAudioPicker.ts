import { useCallback, useState } from 'react'
import * as DocumentPicker from 'expo-document-picker'
import { MAX_RECORDING_BYTES } from '../config'

export type PickedAudio = {
  uri: string
  name: string
  mimeType: string
  size: number
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function resolveMimeType(name: string, mimeType?: string | null) {
  if (mimeType?.startsWith('audio/')) return mimeType
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'mp3':
      return 'audio/mpeg'
    case 'wav':
      return 'audio/wav'
    case 'm4a':
    case 'mp4':
      return 'audio/mp4'
    case 'aac':
      return 'audio/aac'
    case 'ogg':
      return 'audio/ogg'
    case 'amr':
      return 'audio/amr'
    default:
      return 'audio/mp4'
  }
}

export function useAudioPicker() {
  const [file, setFile] = useState<PickedAudio | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)

  const pick = useCallback(async () => {
    setError(null)
    setPicking(true)
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
        multiple: false,
      })
      if (result.canceled || !result.assets?.[0]) return

      const asset = result.assets[0]
      const name = asset.name || `recording-${Date.now()}.m4a`
      const size = asset.size ?? 0
      if (size > MAX_RECORDING_BYTES) {
        setError(`文件超过 ${formatSize(MAX_RECORDING_BYTES)}，请选择更小的录音`)
        return
      }

      setFile({
        uri: asset.uri,
        name,
        mimeType: resolveMimeType(name, asset.mimeType),
        size,
      })
    } catch {
      setError('选择文件失败，请重试')
    } finally {
      setPicking(false)
    }
  }, [])

  const clear = useCallback(() => {
    setFile(null)
    setError(null)
  }, [])

  return {
    file,
    error,
    picking,
    sizeLabel: file ? formatSize(file.size) : null,
    pick,
    clear,
  }
}
