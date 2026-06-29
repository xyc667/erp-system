import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Select, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { authService } from '../services/auth'
import { tenantsService, Tenant } from '../services/tenants'
import { useAuthStore } from '../store/useAuthStore'
import { useRegionalStore } from '../store/useRegionalStore'
import { useNavigate } from 'react-router-dom'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Login() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [form] = Form.useForm()

  useEffect(() => {
    tenantsService.listPublic()
      .then((res) => setTenants(res.data))
      .catch(() => setTenants([{ id: '', code: 'default', name: t('app.defaultTenant') }]))
  }, [t])

  const handleSubmit = async (values: { tenantCode: string; username: string; password: string }) => {
    setLoading(true)
    try {
      const response = await authService.login(values.username, values.password, values.tenantCode)
      const { access_token, refresh_token, user } = response.data
      login(user, access_token, refresh_token)
      useRegionalStore.getState().applyFromServer({
        timezone: user.timezone,
        currency: user.currency,
      })
      message.success(t('app.loginSuccess'))
      navigate('/dashboard')
    } catch {
      message.error(t('errors.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 p-4">
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          position: 'relative',
        }}
      >
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('app.title')}</h1>
          <p className="text-gray-500 mt-2">{t('app.subtitle')}</p>
        </div>
        <Form
          form={form}
          name="login"
          data-testid="login-form"
          initialValues={{ tenantCode: 'default', username: 'admin' }}
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item name="tenantCode" rules={[{ required: true, message: t('app.requiredTenant') }]}>
            <Select size="large" placeholder={t('app.tenant')}>
              {tenants.map((tenant) => (
                <Select.Option key={tenant.code} value={tenant.code}>{tenant.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="username"
            rules={[{ required: true, message: t('common.requiredUsername') }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('app.username')}
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: t('common.requiredPassword') }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('app.password')}
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              data-testid="login-submit"
              style={{
                background: '#1a365d',
                borderColor: '#1a365d',
              }}
            >
              {t('app.login')}
            </Button>
          </Form.Item>
          <div className="text-center text-gray-500 text-sm">
            {t('app.loginHint')}
          </div>
        </Form>
      </Card>
    </div>
  )
}
