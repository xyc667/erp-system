import { Dropdown, message } from 'antd'
import { GlobalOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { authService } from '../services/auth'
import {
  CURRENCIES,
  TIMEZONES,
  useRegionalStore,
  type CurrencyCode,
  type TimezoneId,
} from '../store/useRegionalStore'

export default function RegionalSettings() {
  const { t } = useTranslation()
  const { currency, timezone, setCurrency, setTimezone } = useRegionalStore()

  const savePreference = async (data: { timezone?: string; currency?: string }) => {
    try {
      await authService.updatePreferences(data)
      message.success(t('regional.saved'))
    } catch {
      message.error(t('regional.saveFailed'))
    }
  }

  const items = [
    {
      key: 'tz',
      type: 'group' as const,
      label: t('regional.timezone'),
      children: TIMEZONES.map((tz) => ({
        key: `tz-${tz}`,
        label: tz,
        onClick: () => {
          setTimezone(tz as TimezoneId)
          savePreference({ timezone: tz })
        },
      })),
    },
    {
      key: 'cur',
      type: 'group' as const,
      label: t('regional.currency'),
      children: CURRENCIES.map((c) => ({
        key: `cur-${c}`,
        label: c,
        onClick: () => {
          setCurrency(c as CurrencyCode)
          savePreference({ currency: c })
        },
      })),
    },
  ]

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <button
        type="button"
        className="hidden md:flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:border-gray-300"
        aria-label={t('regional.settings')}
      >
        <GlobalOutlined />
        <span>{timezone.split('/').pop()}</span>
        <span>·</span>
        <span>{currency}</span>
      </button>
    </Dropdown>
  )
}
