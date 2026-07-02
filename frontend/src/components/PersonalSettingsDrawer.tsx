import { useEffect, useState } from 'react'
import { Divider, Form, Input, Select, message } from 'antd'
import { useTranslation } from 'react-i18next'
import FormDrawer from './FormDrawer'
import { authService } from '../services/auth'
import { useAuthStore } from '../store/useAuthStore'
import {
  CURRENCIES,
  TIMEZONES,
  useRegionalStore,
  type CurrencyCode,
  type TimezoneId,
} from '../store/useRegionalStore'
import { loadCatName, saveCatName } from './assistant/assistantStorage'

interface PersonalSettingsDrawerProps {
  open: boolean
  onClose: () => void
}

interface ProfileFormValues {
  name: string
  email?: string
  phone?: string
  timezone: TimezoneId
  currency: CurrencyCode
  catName?: string
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

export default function PersonalSettingsDrawer({ open, onClose }: PersonalSettingsDrawerProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const { currency, timezone, setCurrency, setTimezone } = useRegionalStore()
  const [form] = Form.useForm<ProfileFormValues>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    const load = async () => {
      try {
        const res = await authService.getMe()
        const profile = res.data
        if (profile.timezone) setTimezone(profile.timezone as TimezoneId)
        if (profile.currency) setCurrency(profile.currency as CurrencyCode)
        form.setFieldsValue({
          name: profile.name,
          email: profile.email ?? '',
          phone: profile.phone ?? '',
          timezone: (profile.timezone as TimezoneId) ?? timezone,
          currency: (profile.currency as CurrencyCode) ?? currency,
          catName: loadCatName(),
        })
      } catch {
        form.setFieldsValue({
          name: user?.name ?? '',
          timezone,
          currency,
          catName: loadCatName(),
        })
      }
    }

    load()
  }, [open, form, user?.name, timezone, currency, setCurrency, setTimezone])

  const handleFinish = async (values: ProfileFormValues) => {
    setLoading(true)
    try {
      let profile = await authService.getMe().then((res) => res.data)

      profile = (
        await authService.updateProfile({
          name: values.name,
          email: values.email || undefined,
          phone: values.phone || undefined,
        })
      ).data

      profile = (
        await authService.updatePreferences({
          timezone: values.timezone,
          currency: values.currency,
        })
      ).data

      setTimezone(values.timezone)
      setCurrency(values.currency)
      saveCatName(values.catName ?? '')

      if (values.newPassword) {
        if (!values.currentPassword) {
          message.error(t('profile.currentPasswordRequired'))
          return
        }
        if (values.newPassword !== values.confirmPassword) {
          message.error(t('profile.passwordMismatch'))
          return
        }
        await authService.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        })
      }

      if (user) {
        setUser({
          ...user,
          name: profile.name,
          permissions: profile.permissions,
        })
      }

      message.success(t('profile.saved'))
      form.setFieldsValue({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      onClose()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message
      if (Array.isArray(msg)) {
        message.error(msg[0])
      } else if (typeof msg === 'string') {
        message.error(msg)
      } else {
        message.error(t('profile.saveFailed'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormDrawer
      open={open}
      title={t('app.settings')}
      subtitle={t('profile.subtitle')}
      form={form}
      onFinish={handleFinish}
      onClose={onClose}
      submitLoading={loading}
      destroyOnClose
    >
      <Form.Item label={t('app.username')}>
        <Input value={user?.username} disabled />
      </Form.Item>
      <Form.Item label={t('profile.role')}>
        <Input
          value={typeof user?.role === 'string' ? user.role : user?.role?.name ?? ''}
          disabled
        />
      </Form.Item>
      {user?.tenantName && (
        <Form.Item label={t('app.tenant')}>
          <Input value={user.tenantName} disabled />
        </Form.Item>
      )}

      <Divider plain>{t('profile.basicSection')}</Divider>
      <Form.Item
        name="name"
        label={t('common.name')}
        rules={[{ required: true, message: t('profile.nameRequired') }]}
      >
        <Input maxLength={100} />
      </Form.Item>
      <Form.Item name="email" label={t('profile.email')}>
        <Input type="email" maxLength={100} />
      </Form.Item>
      <Form.Item name="phone" label={t('common.phone')}>
        <Input maxLength={20} />
      </Form.Item>

      <Divider plain>{t('profile.regionalSection')}</Divider>
      <Form.Item name="timezone" label={t('regional.timezone')}>
        <Select
          options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
          showSearch
          optionFilterProp="label"
        />
      </Form.Item>
      <Form.Item name="currency" label={t('regional.currency')}>
        <Select options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
      </Form.Item>

      <Divider plain>{t('profile.assistantSection')}</Divider>
      <Form.Item name="catName" label={t('assistant.catNameLabel')}>
        <Input maxLength={12} placeholder={t('assistant.catNamePlaceholder')} />
      </Form.Item>

      <Divider plain>{t('profile.securitySection')}</Divider>
      <Form.Item name="currentPassword" label={t('profile.currentPassword')}>
        <Input.Password autoComplete="current-password" />
      </Form.Item>
      <Form.Item name="newPassword" label={t('profile.newPassword')}>
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        label={t('profile.confirmPassword')}
        dependencies={['newPassword']}
        rules={[
          ({ getFieldValue }) => ({
            validator(_, value) {
              const next = getFieldValue('newPassword')
              if (!next || !value || next === value) {
                return Promise.resolve()
              }
              return Promise.reject(new Error(t('profile.passwordMismatch')))
            },
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>
    </FormDrawer>
  )
}
