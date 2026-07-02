import { useMemo, useState, useEffect } from 'react'
import { Layout, Menu } from 'antd'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  CreditCardOutlined,
  ShoppingCartOutlined,
  PauseOutlined,
  ForkOutlined,
  BuildOutlined,
  FileTextOutlined,
  FolderOutlined,
  SettingOutlined,
  FundProjectionScreenOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/useAuthStore'
import { ROUTE_I18N_KEYS } from '../../config/routeI18n'
import { brand } from '../../theme/brand'
import SiderLogo from './SiderLogo'

const { Sider } = Layout

type MenuItem = Required<MenuProps>['items'][number]
type MenuItemWithPerm = MenuItem & {
  permissions?: string[]
  children?: MenuItemWithPerm[]
}

function routeLabel(t: (k: string) => string, path: string) {
  return t(ROUTE_I18N_KEYS[path])
}

function businessModules(t: (k: string) => string): MenuItemWithPerm[] {
  return [
    {
      key: 'finance',
      icon: <CreditCardOutlined />,
      label: t('menu.finance'),
      permissions: ['finance:gl', 'finance:ar', 'finance:ap', 'finance:asset', 'finance:report', 'finance:budget'],
      children: [
        { key: '/finance/gl', label: routeLabel(t, '/finance/gl'), permissions: ['finance:gl'] },
        { key: '/finance/ar', label: routeLabel(t, '/finance/ar'), permissions: ['finance:ar'] },
        { key: '/finance/ap', label: routeLabel(t, '/finance/ap'), permissions: ['finance:ap'] },
        { key: '/finance/assets', label: routeLabel(t, '/finance/assets'), permissions: ['finance:asset'] },
        { key: '/finance/report', label: routeLabel(t, '/finance/report'), permissions: ['finance:report'] },
        { key: '/finance/budget', label: routeLabel(t, '/finance/budget'), permissions: ['finance:budget'] },
      ],
    },
    {
      key: 'procurement',
      icon: <ShoppingCartOutlined />,
      label: t('menu.procurement'),
      permissions: ['procurement:vendor', 'procurement:request', 'procurement:order', 'procurement:receive'],
      children: [
        { key: '/procurement/vendor', label: routeLabel(t, '/procurement/vendor'), permissions: ['procurement:vendor'] },
        { key: '/procurement/request', label: routeLabel(t, '/procurement/request'), permissions: ['procurement:request'] },
        { key: '/procurement/order', label: routeLabel(t, '/procurement/order'), permissions: ['procurement:order'] },
        { key: '/procurement/receive', label: routeLabel(t, '/procurement/receive'), permissions: ['procurement:receive', 'procurement:order'] },
      ],
    },
    {
      key: 'sales',
      icon: <PauseOutlined />,
      label: t('menu.sales'),
      permissions: ['sales:customer', 'sales:quote', 'sales:order', 'sales:delivery', 'sales:service', 'lead:view', 'lead:review'],
      children: [
        { key: '/sales/customer', label: routeLabel(t, '/sales/customer'), permissions: ['sales:customer'] },
        { key: '/sales/quote', label: routeLabel(t, '/sales/quote'), permissions: ['sales:quote'] },
        { key: '/sales/order', label: routeLabel(t, '/sales/order'), permissions: ['sales:order'] },
        { key: '/sales/delivery', label: routeLabel(t, '/sales/delivery'), permissions: ['sales:delivery', 'sales:order'] },
        { key: '/sales/service', label: routeLabel(t, '/sales/service'), permissions: ['sales:service'] },
        { key: '/sales/leads/pool', label: routeLabel(t, '/sales/leads/pool'), permissions: ['lead:view'] },
        { key: '/sales/leads/mine', label: routeLabel(t, '/sales/leads/mine'), permissions: ['lead:view'] },
        { key: '/sales/leads/stats', label: routeLabel(t, '/sales/leads/stats'), permissions: ['lead:view', 'lead:manage'] },
        { key: '/sales/leads/reports', label: routeLabel(t, '/sales/leads/reports'), permissions: ['lead:review', 'lead:manage'] },
      ],
    },
    {
      key: 'production',
      icon: <ForkOutlined />,
      label: t('menu.production'),
      permissions: ['production:bom', 'production:plan', 'production:workorder', 'production:quality'],
      children: [
        { key: '/production/bom', label: routeLabel(t, '/production/bom'), permissions: ['production:bom'] },
        { key: '/production/plan', label: routeLabel(t, '/production/plan'), permissions: ['production:plan'] },
        { key: '/production/work-order', label: routeLabel(t, '/production/work-order'), permissions: ['production:workorder'] },
        { key: '/production/quality', label: routeLabel(t, '/production/quality'), permissions: ['production:quality'] },
      ],
    },
    {
      key: 'inventory',
      icon: <BuildOutlined />,
      label: t('menu.inventory'),
      permissions: ['inventory:stock', 'inventory:inout', 'inventory:alert'],
      children: [
        { key: '/inventory/stock', label: routeLabel(t, '/inventory/stock'), permissions: ['inventory:stock'] },
        { key: '/inventory/inout', label: routeLabel(t, '/inventory/inout'), permissions: ['inventory:inout'] },
        { key: '/inventory/alert', label: routeLabel(t, '/inventory/alert'), permissions: ['inventory:alert'] },
        { key: '/inventory/stocktake', label: routeLabel(t, '/inventory/stocktake'), permissions: ['inventory:inout'] },
        { key: '/inventory/transfer', label: routeLabel(t, '/inventory/transfer'), permissions: ['inventory:inout'] },
        { key: '/inventory/trace', label: routeLabel(t, '/inventory/trace'), permissions: ['inventory:trace'] },
        { key: '/inventory/product', label: routeLabel(t, '/inventory/product'), permissions: ['inventory:stock'] },
        { key: '/inventory/warehouse', label: routeLabel(t, '/inventory/warehouse'), permissions: ['inventory:stock'] },
      ],
    },
    {
      key: 'hr',
      icon: <UserOutlined />,
      label: t('menu.hr'),
      permissions: ['hr:employee', 'hr:attendance', 'hr:salary', 'hr:performance'],
      children: [
        { key: '/hr/employee', label: routeLabel(t, '/hr/employee'), permissions: ['hr:employee'] },
        { key: '/hr/department', label: routeLabel(t, '/hr/department'), permissions: ['hr:employee'] },
        { key: '/hr/position', label: routeLabel(t, '/hr/position'), permissions: ['hr:employee'] },
        { key: '/hr/attendance', label: routeLabel(t, '/hr/attendance'), permissions: ['hr:attendance'] },
        { key: '/hr/salary', label: routeLabel(t, '/hr/salary'), permissions: ['hr:salary'] },
        { key: '/hr/performance', label: routeLabel(t, '/hr/performance'), permissions: ['hr:performance'] },
      ],
    },
    {
      key: '/project',
      icon: <FolderOutlined />,
      label: t('menu.project'),
      permissions: ['project:manage'],
    },
  ]
}

function buildMenuItems(t: (k: string) => string): MenuItemWithPerm[] {
  return [
    { key: '/dashboard', icon: <DashboardOutlined />, label: t('menu.dashboard') },
    { key: '/bi-screen', icon: <FundProjectionScreenOutlined />, label: t('menu.biScreen') },
    {
      type: 'group',
      label: t('menu.group.business'),
      children: businessModules(t),
    },
    {
      type: 'group',
      label: t('menu.group.analytics'),
      children: [
        {
          key: '/report',
          icon: <FileTextOutlined />,
          label: t('menu.report'),
          permissions: ['report:center'],
        },
        {
          key: '/report/intelligence',
          icon: <FundProjectionScreenOutlined />,
          label: t('routes.intelligence'),
          permissions: ['report:center', 'inventory:alert', 'finance:report'],
        },
      ],
    },
    {
      type: 'group',
      label: t('menu.group.system'),
      children: [
        {
          key: 'system',
          icon: <SettingOutlined />,
          label: t('menu.system'),
          permissions: ['user:manage', 'user:view', 'role:manage', 'system:config', 'integration:sync', 'system:audit', 'system:tenant', 'file:manage', 'lead:import'],
          children: [
            { key: '/system/user', label: routeLabel(t, '/system/user'), permissions: ['user:manage', 'user:view'] },
            { key: '/system/role', label: routeLabel(t, '/system/role'), permissions: ['role:manage'] },
            { key: '/system/config', label: routeLabel(t, '/system/config'), permissions: ['system:config'] },
            { key: '/system/files', label: routeLabel(t, '/system/files'), permissions: ['file:manage', 'system:config'] },
            { key: '/system/leads/import', label: routeLabel(t, '/system/leads/import'), permissions: ['lead:import'] },
            { key: '/system/integration', label: routeLabel(t, '/system/integration'), permissions: ['integration:sync'] },
            { key: '/system/audit', label: routeLabel(t, '/system/audit'), permissions: ['system:audit'] },
            { key: '/system/tenant', label: routeLabel(t, '/system/tenant'), permissions: ['system:tenant'] },
          ],
        },
      ],
    },
  ]
}

function filterMenuItems(
  items: MenuItemWithPerm[],
  hasPermission: (...codes: string[]) => boolean,
): MenuItem[] {
  return items
    .map((item) => {
      if (!item) return null
      if ('type' in item && item.type === 'group') {
        const children = item.children
          ? filterMenuItems(item.children as MenuItemWithPerm[], hasPermission)
          : []
        if (children.length === 0) return null
        return { ...item, children }
      }

      const children = item.children
        ? filterMenuItems(item.children, hasPermission)
        : undefined

      if (children && children.length === 0) return null
      if (item.permissions && !hasPermission(...item.permissions)) return null

      const { permissions: _, children: __, ...menuItem } = item
      if (children) {
        return { ...menuItem, children }
      }
      return menuItem
    })
    .filter(Boolean) as MenuItem[]
}

function resolveOpenKeys(pathname: string): string[] {
  if (pathname.startsWith('/system')) return ['system']
  if (pathname.startsWith('/finance')) return ['finance']
  if (pathname.startsWith('/procurement')) return ['procurement']
  if (pathname.startsWith('/sales')) return ['sales']
  if (pathname.startsWith('/production')) return ['production']
  if (pathname.startsWith('/inventory')) return ['inventory']
  if (pathname.startsWith('/hr')) return ['hr']
  return []
}

function resolveSelectedKey(pathname: string): string {
  const flatKeys = [
    '/dashboard', '/bi-screen', '/finance/gl', '/finance/ar', '/finance/ap', '/finance/assets', '/finance/report', '/finance/budget',
    '/procurement/vendor', '/procurement/request', '/procurement/order', '/procurement/receive',
    '/sales/customer', '/sales/quote', '/sales/order', '/sales/delivery', '/sales/service',
    '/sales/leads/pool', '/sales/leads/mine', '/sales/leads/stats', '/sales/leads/reports',
    '/production/bom', '/production/plan', '/production/work-order', '/production/quality',
    '/inventory/stock', '/inventory/inout', '/inventory/alert', '/inventory/stocktake', '/inventory/transfer', '/inventory/trace', '/inventory/product', '/inventory/warehouse',
    '/hr/employee', '/hr/department', '/hr/position', '/hr/attendance', '/hr/salary', '/hr/performance',
    '/project', '/report', '/report/intelligence',
    '/system/user', '/system/role', '/system/config', '/system/files', '/system/leads/import', '/system/integration', '/system/audit', '/system/tenant',
  ]
  return flatKeys.find((key) => pathname.startsWith(key)) || '/dashboard'
}

export default function AppSider({
  inlineCollapsed = false,
  onNavigate,
}: {
  inlineCollapsed?: boolean
  onNavigate?: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const hasPermission = useAuthStore((state) => state.hasPermission)

  const menuItems = useMemo(
    () => filterMenuItems(buildMenuItems(t), hasPermission),
    [t, hasPermission],
  )

  const [openKeys, setOpenKeys] = useState<string[]>(() => resolveOpenKeys(location.pathname))

  useEffect(() => {
    setOpenKeys((prev) => {
      const next = resolveOpenKeys(location.pathname)
      return next.length ? [...new Set([...prev, ...next])] : prev
    })
  }, [location.pathname])

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key.startsWith('/')) {
      navigate(key)
      onNavigate?.()
    }
  }

  return (
    <Sider
      theme="dark"
      width={250}
      collapsed={inlineCollapsed}
      style={{ background: brand.primary, minHeight: inlineCollapsed ? undefined : '100vh' }}
    >
      <SiderLogo collapsed={inlineCollapsed} />
      <Menu
        className="app-sider-menu"
        mode="inline"
        theme="dark"
        selectedKeys={[resolveSelectedKey(location.pathname)]}
        openKeys={inlineCollapsed ? [] : openKeys}
        onOpenChange={setOpenKeys}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ background: brand.primary, borderRight: 'none', padding: '8px 0 16px' }}
      />
    </Sider>
  )
}
