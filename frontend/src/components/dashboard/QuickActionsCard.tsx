import { Button } from 'antd'
import {
  TeamOutlined,
  UserOutlined,
  AuditOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { brand } from '../../theme/brand'

interface ActionItem {
  key: string
  labelKey: string
  path: string
  icon: React.ReactNode
  permissions: string[] | null
}

const actions: ActionItem[] = [
  { key: 'pool', labelKey: 'dashboard.quick.pool', path: '/sales/leads/pool', icon: <TeamOutlined />, permissions: ['lead:view'] },
  { key: 'mine', labelKey: 'dashboard.quick.mine', path: '/sales/leads/mine', icon: <UserOutlined />, permissions: ['lead:view'] },
  { key: 'reports', labelKey: 'dashboard.quick.reports', path: '/sales/leads/reports', icon: <AuditOutlined />, permissions: ['lead:review', 'lead:manage'] },
  { key: 'bi', labelKey: 'dashboard.quick.bi', path: '/bi-screen', icon: <DashboardOutlined />, permissions: null },
]

export default function QuickActionsCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const hasPermission = useAuthStore((s) => s.hasPermission)

  const visible = actions.filter(
    (a) => !a.permissions || a.permissions.some((p) => hasPermission(p)),
  )

  if (visible.length === 0) return null

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '20px 22px',
        boxShadow: brand.cardShadow,
        height: '100%',
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: brand.primaryMuted,
          marginBottom: 14,
          fontWeight: 500,
        }}
      >
        {t('dashboard.quickActions')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map((a) => (
          <Button
            key={a.key}
            type="default"
            block
            icon={a.icon}
            onClick={() => navigate(a.path)}
            style={{
              textAlign: 'left',
              height: 40,
              borderColor: '#e2e8f0',
              color: brand.primary,
            }}
          >
            {t(a.labelKey)}
          </Button>
        ))}
      </div>
    </div>
  )
}
