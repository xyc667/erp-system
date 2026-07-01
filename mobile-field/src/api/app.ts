import axios from 'axios'
import { Platform } from 'react-native'
import { API_URL } from '../config'

export interface FieldMobileVersionInfo {
  versionCode: number
  versionName: string
  minVersionCode: number
  forceUpdate: boolean
  releaseNotes: string
  downloadUrl: string
  /** Android legacy field */
  apkUrl?: string
}

export async function fetchFieldMobileLatest(): Promise<FieldMobileVersionInfo> {
  const path =
    Platform.OS === 'ios' ? '/app/field-ios/latest' : '/app/field-android/latest'
  const res = await axios.get<FieldMobileVersionInfo>(`${API_URL}${path}`, {
    timeout: 10000,
  })
  const data = res.data
  return {
    ...data,
    downloadUrl: data.downloadUrl || data.apkUrl || '',
  }
}

/** @deprecated use fetchFieldMobileLatest */
export const fetchFieldAndroidLatest = fetchFieldMobileLatest

export type FieldAndroidVersionInfo = FieldMobileVersionInfo
