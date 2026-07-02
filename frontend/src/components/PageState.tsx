import type { ReactNode } from 'react'
import PageEmpty from './PageEmpty'
import type { EmptyVariant } from './EmptyIllustration'

interface PageStateProps {
  description?: ReactNode
  variant?: EmptyVariant
  action?: ReactNode
  minHeight?: number | string
}

/** 整页空状态（看板、报表加载失败等） */
export default function PageState({
  description,
  variant = 'default',
  action,
  minHeight = 320,
}: PageStateProps) {
  return (
    <div
      className="page-state"
      style={{
        minHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      <PageEmpty variant={variant} description={description} action={action} imageSize={120} />
    </div>
  )
}
