import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const CURRENCIES = ['CNY', 'USD', 'EUR', 'JPY', 'GBP'] as const
export type CurrencyCode = (typeof CURRENCIES)[number]

export const TIMEZONES = [
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
] as const
export type TimezoneId = (typeof TIMEZONES)[number]

interface RegionalState {
  currency: CurrencyCode
  timezone: TimezoneId
  setCurrency: (currency: CurrencyCode) => void
  setTimezone: (timezone: TimezoneId) => void
  applyFromServer: (prefs: { timezone?: string; currency?: string }) => void
}

const isTimezone = (v: string): v is TimezoneId => TIMEZONES.includes(v as TimezoneId)
const isCurrency = (v: string): v is CurrencyCode => CURRENCIES.includes(v as CurrencyCode)

export const useRegionalStore = create<RegionalState>()(
  persist(
    (set) => ({
      currency: 'CNY',
      timezone: 'Asia/Shanghai',
      setCurrency: (currency) => set({ currency }),
      setTimezone: (timezone) => set({ timezone }),
      applyFromServer: (prefs) => {
        const next: Partial<RegionalState> = {}
        if (prefs.timezone && isTimezone(prefs.timezone)) next.timezone = prefs.timezone
        if (prefs.currency && isCurrency(prefs.currency)) next.currency = prefs.currency
        if (Object.keys(next).length) set(next)
      },
    }),
    { name: 'erp_regional' },
  ),
)
