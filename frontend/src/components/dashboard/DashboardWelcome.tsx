import { useEffect, useState } from 'react'
import { Badge } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/useAuthStore'
import { notificationsService } from '../../services/notifications'
import { brand } from '../../theme/brand'

interface DashboardWelcomeProps {
  userCount?: number
}

function getGreetingKey(): 'morning' | 'afternoon' | 'evening' {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

export default function DashboardWelcome({ userCount }: DashboardWelcomeProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    notificationsService
      .getUnreadCount()
      .then((res) => setUnread(typeof res.data === 'number' ? res.data : 0))
      .catch(() => setUnread(0))
  }, [])

  const greeting = t(`dashboard.greeting.${getGreetingKey()}`)
  const displayName = user?.name || user?.username || t('dashboard.guest')

  return (
    <div
      data-testid="dashboard-title"
      style={{
        background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryLight} 100%)`,
        borderRadius: 12,
        padding: '22px 28px',
        marginBottom: 20,
        color: '#fff',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        boxShadow: '0 4px 14px rgba(26, 54, 93, 0.25)',
      }}
    >
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          {greeting}，{displayName}
        </div>
        <div style={{ fontSize: 14, opacity: 0.85 }}>{t('dashboard.welcomeSubtitle')}</div>
      </div>
      {unread > 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.15)',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          <Badge count={unread} size="small">
            <BellOutlined style={{ fontSize: 18, color: '#fff' }} />
          </Badge>
          <span>{t('dashboard.unreadMessages', { count: unread })}</span>
        </div>
      ) : userCount != null ? (
        <div style={{ fontSize: 14, opacity: 0.9 }}>
          {t('dashboard.usersSummary', { count: userCount })}
        </div>
      ) : null}
    </div>
  )
}
