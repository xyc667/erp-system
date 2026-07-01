import { Alert, Linking, Platform } from 'react-native'
import type { Lead } from '../types/api'

function parseCoord(value?: number | string | null): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : parseFloat(value)
  return Number.isFinite(n) ? n : null
}

function buildAddressQuery(lead: Pick<Lead, 'name' | 'district' | 'address'>) {
  const parts = [lead.district, lead.address, lead.name].filter(Boolean)
  return parts.join('')
}

export function canNavigateToLead(lead: Pick<Lead, 'name' | 'district' | 'address' | 'lat' | 'lng'>) {
  const lat = parseCoord(lead.lat)
  const lng = parseCoord(lead.lng)
  if (lat != null && lng != null) return true
  return Boolean(buildAddressQuery(lead))
}

export async function openMapNavigation(lead: Pick<Lead, 'name' | 'district' | 'address' | 'lat' | 'lng'>) {
  const lat = parseCoord(lead.lat)
  const lng = parseCoord(lead.lng)
  const label = encodeURIComponent(lead.name || '目的地')

  const urls: string[] = []
  if (lat != null && lng != null) {
    if (Platform.OS === 'android') {
      urls.push(`geo:${lat},${lng}?q=${lat},${lng}(${label})`)
      urls.push(`androidamap://viewMap?sourceApplication=erp-field&poiname=${label}&lat=${lat}&lon=${lng}&dev=0`)
    } else {
      urls.push(`maps:?q=${lat},${lng}`)
    }
    urls.push(`https://uri.amap.com/marker?position=${lng},${lat}&name=${label}`)
  } else {
    const query = encodeURIComponent(buildAddressQuery(lead))
    if (!query) {
      Alert.alert('无法导航', '该线索暂无地址或坐标')
      return
    }
    if (Platform.OS === 'android') {
      urls.push(`geo:0,0?q=${query}`)
    } else {
      urls.push(`maps:?q=${query}`)
    }
    urls.push(`https://uri.amap.com/search?keyword=${query}`)
  }

  for (const url of urls) {
    try {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
        return
      }
    } catch {
      /* try next */
    }
  }

  try {
    await Linking.openURL(urls[urls.length - 1])
  } catch {
    Alert.alert('无法打开地图', '请确认已安装高德地图或其他地图应用')
  }
}
