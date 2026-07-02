import type { ReactNode } from 'react'
import { Empty } from 'antd'
import { useTranslation } from 'react-i18next'
import { brand } from '../theme/brand'
import EmptyIllustration, { type EmptyVariant } from './EmptyIllustration'

interface PageEmptyProps {
  description?: ReactNode
  variant?: EmptyVariant
  action?: ReactNode
  className?: string
  imageSize?: number
}

/** 表格 / 列表空状态 */
export default function PageEmpty({
  description,
  variant = 'default',
  action,
  className,
  imageSize = 100,
}: PageEmptyProps) {
  const { t } = useTranslation()

  return (
    <Empty
      className={className}
      image={<EmptyIllustration variant={variant} size={imageSize} />}
      styles={{ image: { height: imageSize } }}
      description={
        <span style={{ color: brand.primaryMuted, fontSize: 14 }}>
          {description ?? t('common.noData')}
        </span>
      }
    >
      {action}
    </Empty>
  )
}
