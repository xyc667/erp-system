import { AppstoreOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

export default function SiderLogo({ collapsed }: { collapsed?: boolean }) {
  const { t } = useTranslation()

  return (
    <div
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        padding: collapsed ? '0 12px' : '0 20px',
        gap: 12,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#90cdf4',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        <AppstoreOutlined />
      </div>
      {!collapsed && (
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: '#fff',
              fontSize: 17,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '0.02em',
            }}
          >
            {t('app.brand')}
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: 11,
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {t('app.brandSubtitle')}
          </div>
        </div>
      )}
    </div>
  )
}
