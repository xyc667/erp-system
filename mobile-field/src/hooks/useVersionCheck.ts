import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Linking, Platform } from 'react-native'
import * as Application from 'expo-application'
import Constants from 'expo-constants'
import { fetchFieldMobileLatest, type FieldMobileVersionInfo } from '../api/app'

export function getAppVersionCode(): number {
  const build = Application.nativeBuildVersion
  const parsed = build ? parseInt(build, 10) : NaN
  if (Number.isFinite(parsed)) return parsed

  if (Platform.OS === 'android') {
    const fromConfig = Constants.expoConfig?.android?.versionCode
    if (typeof fromConfig === 'number') return fromConfig
  }
  if (Platform.OS === 'ios') {
    const fromConfig = Constants.expoConfig?.ios?.buildNumber
    if (fromConfig) {
      const n = parseInt(String(fromConfig), 10)
      if (Number.isFinite(n)) return n
    }
  }
  return 1
}

export function getAppVersionName(): string {
  return Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '1.0.0'
}

function needsForceUpdate(current: number, latest: FieldMobileVersionInfo): boolean {
  if (current < latest.minVersionCode) return true
  if (latest.forceUpdate && current < latest.versionCode) return true
  return false
}

function hasOptionalUpdate(current: number, latest: FieldMobileVersionInfo): boolean {
  return current < latest.versionCode
}

export function useVersionCheck() {
  const [loading, setLoading] = useState(true)
  const [latest, setLatest] = useState<FieldMobileVersionInfo | null>(null)
  const [forced, setForced] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const optionalShown = useRef(false)
  const currentCode = getAppVersionCode()
  const currentName = getAppVersionName()
  const isIos = Platform.OS === 'ios'

  const openDownload = useCallback((url: string) => {
    if (!url) {
      Alert.alert('提示', isIos ? '请通过 TestFlight 安装更新' : '下载地址未配置')
      return
    }
    Linking.openURL(url).catch(() => {
      Alert.alert('无法打开链接', url)
    })
  }, [isIos])

  const check = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const info = await fetchFieldMobileLatest()
      setLatest(info)
      const force = needsForceUpdate(currentCode, info)
      setForced(force)
      if (!force && hasOptionalUpdate(currentCode, info) && !optionalShown.current) {
        optionalShown.current = true
        Alert.alert(
          '发现新版本',
          `v${info.versionName}\n${info.releaseNotes || ''}`,
          [
            { text: '稍后', style: 'cancel' },
            {
              text: isIos ? '前往 TestFlight' : '立即更新',
              onPress: () => openDownload(info.downloadUrl),
            },
          ],
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '版本检查失败')
    } finally {
      setLoading(false)
    }
  }, [currentCode, openDownload, isIos])

  useEffect(() => {
    check()
  }, [check])

  return {
    loading,
    latest,
    forced,
    error,
    currentCode,
    currentName,
    isIos,
    openDownload,
    retry: check,
  }
}
