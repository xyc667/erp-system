import type { ReactNode } from 'react'
import { brand } from '../../theme/brand'

interface MetricCardProps {
  title: string
  value: ReactNode
  icon: ReactNode
  iconBg: string
  iconColor: string
  suffix?: ReactNode
}

export default function MetricCard({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  suffix,
}: MetricCardProps) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '20px 22px',
        boxShadow: brand.cardShadow,
        height: '100%',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = brand.cardShadowHover
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = brand.cardShadow
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              color: brand.primaryMuted,
              marginBottom: 8,
              fontWeight: 500,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: brand.primary,
              lineHeight: 1.2,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value}
            {suffix ? (
              <span style={{ fontSize: 14, fontWeight: 500, color: brand.primaryMuted, marginLeft: 4 }}>
                {suffix}
              </span>
            ) : null}
          </div>
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
            marginLeft: 12,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
