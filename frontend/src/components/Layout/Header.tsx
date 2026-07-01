import { Layout, Dropdown, Avatar, MenuProps, Badge, List, Button } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined, BellOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { notificationsService, Notification } from '../../services/notifications'
import { useNotificationSocket } from '../../hooks/useNotificationSocket'
import LanguageSwitcher from '../LanguageSwitcher'
import RegionalSettings from '../RegionalSettings'

const { Header } = Layout

interface AppHeaderProps {
  mobileMenu?: React.ReactNode
}

export default function AppHeader({ mobileMenu }: AppHeaderProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)

  const loadNotifications = useCallback(async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        notificationsService.getAll(),
        notificationsService.getUnreadCount(),
      ])
      setNotifications(listRes.data)
      setUnread(typeof countRes.data === 'number' ? countRes.data : 0)
    } catch {
      setNotifications([])
      setUnread(0)
    }
  }, [])

  useNotificationSocket(loadNotifications)

  useEffect(() => {
    loadNotifications()
    const timer = setInterval(loadNotifications, 60_000)
    return () => clearInterval(timer)
  }, [loadNotifications])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const notificationContent = (
    <div className="w-80 max-w-[90vw] bg-white shadow-lg rounded p-2">
      <div className="flex justify-between items-center px-2 py-1 border-b mb-2">
        <span className="font-medium">{t('app.notifications')}</span>
        <Button type="link" size="small" onClick={async () => {
          await notificationsService.markAllRead()
          loadNotifications()
        }}>{t('app.markAllRead')}</Button>
      </div>
      <List
        size="small"
        dataSource={notifications.slice(0, 8)}
        locale={{ emptyText: t('app.noNotifications') }}
        renderItem={(item) => (
          <List.Item
            className={item.read ? 'opacity-60' : ''}
            onClick={async () => {
              if (!item.read) {
                await notificationsService.markRead(item.id)
                loadNotifications()
              }
              if (item.type.startsWith('lead.report')) {
                navigate('/sales/leads/reports')
              }
            }}
          >
            <List.Item.Meta
              title={<span className="text-sm">{item.title}</span>}
              description={<span className="text-xs text-gray-500">{item.message}</span>}
            />
          </List.Item>
        )}
      />
    </div>
  )

  const items: MenuProps['items'] = [
    { key: '1', icon: <SettingOutlined />, label: t('app.settings') },
    { type: 'divider' },
    { key: '3', icon: <LogoutOutlined />, label: t('app.logout'), onClick: handleLogout },
  ]

  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {mobileMenu}
        <div className="text-base md:text-lg font-semibold text-gray-800 truncate">
          {t('app.brand')}
          {user?.tenantName && (
            <span className="text-xs md:text-sm font-normal text-gray-500 ml-2 hidden sm:inline">
              {user.tenantName}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <RegionalSettings />
        <LanguageSwitcher />
        <Dropdown dropdownRender={() => notificationContent} trigger={['click']}>
          <Badge count={unread} size="small">
            <BellOutlined className="text-lg cursor-pointer" />
          </Badge>
        </Dropdown>
        <Dropdown menu={{ items }} placement="bottomRight">
          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar icon={<UserOutlined />} size="small" />
            <span className="hidden sm:inline">{user?.name || t('common.user')}</span>
          </div>
        </Dropdown>
      </div>
    </Header>
  )
}
