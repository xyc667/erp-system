import type { ReactNode } from 'react'
import type { CardProps } from 'antd'
import PageCard from './PageCard'

/** 页面主内容区 — 统一卡片容器（标题仍用 PageTitle 放在外部） */
export default function PageSection({
  children,
  styles,
  ...props
}: CardProps) {
  return (
    <PageCard
      styles={{
        body: { padding: '16px 20px 20px' },
        ...styles,
      }}
      {...props}
    >
      {children}
    </PageCard>
  )
}

/** 列表页顶部操作栏 */
export function PageToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`page-toolbar${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}
