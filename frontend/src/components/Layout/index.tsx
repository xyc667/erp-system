import { useState } from 'react'
import { Layout, Grid, Drawer, Button } from 'antd'
import { MenuOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import AppSider from './Sider'
import AppHeader from './Header'
import BreadcrumbNav from '../BreadcrumbNav'
import OfflineBanner from '../OfflineBanner'

const { Content } = Layout

interface LayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: LayoutProps) {
  const { t } = useTranslation()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && <AppSider />}
      <Layout>
        <AppHeader
          mobileMenu={
            isMobile ? (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
                aria-label={t('common.openMenu')}
              />
            ) : undefined
          }
        />
        {isMobile && (
          <Drawer
            placement="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            width={260}
            styles={{ body: { padding: 0, background: '#1a365d' } }}
          >
            <AppSider inlineCollapsed={false} onNavigate={() => setDrawerOpen(false)} />
          </Drawer>
        )}
        <Content
          style={{
            padding: isMobile ? '12px' : '24px',
            margin: isMobile ? '8px' : '24px 16px',
            background: '#f5f7fa',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 140px)',
          }}
        >
          <OfflineBanner />
          <BreadcrumbNav />
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
