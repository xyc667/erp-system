import type { ReactNode } from 'react'
import type { DrawerProps } from 'antd'
import { Drawer } from 'antd'
import { brand } from '../theme/brand'

/** 统一侧滑抽屉 — 详情、只读内容 */
export default function PageDrawer({
  className,
  styles,
  width = 520,
  children,
  ...props
}: DrawerProps) {
  return (
    <Drawer
      {...props}
      width={width}
      className={['page-drawer', className].filter(Boolean).join(' ')}
      styles={{
        header: { borderBottom: '1px solid #f1f5f9', padding: '16px 24px' },
        body: { padding: '16px 24px 24px' },
        ...styles,
      }}
    >
      {children}
    </Drawer>
  )
}

export function DrawerSubtitle({ children }: { children: ReactNode }) {
  return (
    <div
      className="drawer-subtitle"
      style={{
        fontWeight: 600,
        color: brand.primary,
        marginBottom: 16,
        fontSize: 15,
      }}
    >
      {children}
    </div>
  )
}
