import type { CurrencyCode, TimezoneId } from '../store/useRegionalStore'

export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  locale: string,
): string {
  return new Intl.NumberFormat(locale.startsWith('en') ? 'en-US' : 'zh-CN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDateTime(
  value: string | Date,
  timezone: TimezoneId,
  locale: string,
): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(locale.startsWith('en') ? 'en-US' : 'zh-CN', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatDate(
  value: string | Date,
  timezone: TimezoneId,
  locale: string,
): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(locale.startsWith('en') ? 'en-US' : 'zh-CN', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
