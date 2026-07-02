import { useState } from 'react'
import { Layout, Dropdown, Avatar, MenuProps, Badge, List, Button } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined, BellOutlined, SmileOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { notificationRoute } from '../../hooks/useNotifications'
import { useNotificationsContext } from '../../contexts/NotificationsContext'
import { showPageAssistant } from '../assistant/PageAssistant'
import { isAssistantEnabled, setAssistantEnabled } from '../assistant/assistantStorage'
import LanguageSwitcher from '../LanguageSwitcher'
import RegionalSettings from '../RegionalSettings'
import PersonalSettingsDrawer from '../PersonalSettingsDrawer'
import { brand } from '../../theme/brand'

const { Header } = Layout

interface AppHeaderProps {
  mobileMenu?: React.ReactNode
}

export default function AppHeader({ mobileMenu }: AppHeaderProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { notifications, unread, markRead, markAllRead } = useNotificationsContext()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const notificationContent = (
    <div className="w-80 max-w-[90vw] bg-white shadow-lg rounded p-2">
      <div className="flex justify-between items-center px-2 py-1 border-b mb-2">
        <span className="font-medium">{t('app.notifications')}</span>
        <Button type="link" size="small" onClick={async () => {
          await markAllRead()
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
                await markRead(item.id)
              }
              const route = notificationRoute(item.type)
              if (route) navigate(route)
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
    {
      key: 'assistant',
      icon: <SmileOutlined />,
      label: isAssistantEnabled() ? t('assistant.hide') : t('assistant.show'),
      onClick: () => {
        if (isAssistantEnabled()) {
          setAssistantEnabled(false)
          window.dispatchEvent(new Event('erp-assistant-hide'))
        } else {
          showPageAssistant()
        }
      },
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('app.settings'),
      onClick: () => setSettingsOpen(true),
    },
    { type: 'divider' },
    { key: '3', icon: <LogoutOutlined />, label: t('app.logout'), onClick: handleLogout },
  ]

  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 16px',
        boxShadow: brand.cardShadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f1f5f9',
        zIndex: 10,
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
      <PersonalSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Header>
  )
}
