import { describe, it, expect } from 'vitest'
import zh from './locales/zh.json'
import en from './locales/en.json'

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenKeys(value as Record<string, unknown>, path)
    }
    return [path]
  })
}

describe('i18n locale parity', () => {
  const zhKeys = flattenKeys(zh).sort()
  const enKeys = flattenKeys(en).sort()

  it('zh and en have the same keys', () => {
    expect(zhKeys).toEqual(enKeys)
  })

  it('covers all route labels', () => {
    const routeKeys = zhKeys.filter((k) => k.startsWith('routes.'))
    expect(routeKeys.length).toBeGreaterThanOrEqual(40)
  })
})
