import type { CSSProperties } from 'react'
import type { CardProps } from 'antd'
import { Card } from 'antd'
import { brand } from '../theme/brand'

/** 全站统一卡片样式 — 无边框 + 品牌阴影 */
export default function PageCard({ style, styles, ...props }: CardProps) {
  return (
    <Card
      variant="borderless"
      style={{
        borderRadius: 12,
        boxShadow: brand.cardShadow,
        ...style,
      }}
      styles={{
        header: { borderBottom: '1px solid #f1f5f9', fontWeight: 600 },
        ...styles,
      }}
      {...props}
    />
  )
}

export function pageCardStyle(): CSSProperties {
  return {
    borderRadius: 12,
    boxShadow: brand.cardShadow,
    border: 'none',
  }
}
