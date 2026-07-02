import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { BiFeedOrder } from '../../services/report'
import { useRegionalStore } from '../../store/useRegionalStore'
import { formatDateTime } from '../../utils/format'

interface BiScrollOrdersProps {
  orders: BiFeedOrder[]
}

export default function BiScrollOrders({ orders }: BiScrollOrdersProps) {
  const { t, i18n } = useTranslation()
  const { timezone } = useRegionalStore()

  const items = useMemo(() => {
    if (orders.length === 0) return []
    const duplicated = [...orders, ...orders]
    return duplicated
  }, [orders])

  if (orders.length === 0) {
    return <div className="bi-screen__ticker-empty">{t('bi.noOrders')}</div>
  }

  return (
    <div className="bi-screen__ticker">
      <div
        className="bi-screen__ticker-track"
        style={{ ['--ticker-duration' as string]: `${Math.max(orders.length * 4, 24)}s` }}
      >
        {items.map((order, i) => (
          <div key={`${order.id}-${i}`} className="bi-screen__ticker-item">
            <span className={`bi-screen__ticker-type bi-screen__ticker-type--${order.type}`}>
              {order.type === 'sales' ? t('bi.orderSales') : t('bi.orderPurchase')}
            </span>
            <span className="bi-screen__ticker-no">{order.orderNo}</span>
            <span className="bi-screen__ticker-party">{order.partyName}</span>
            <span className="bi-screen__ticker-amount">
              {order.totalAmount.toLocaleString(i18n.language)} {t('units.currency')}
            </span>
            <span className={`bi-screen__ticker-status bi-screen__ticker-status--${order.status}`}>
              {t(`status.${order.status}`, { defaultValue: order.status })}
            </span>
            <span className="bi-screen__ticker-time">
              {formatDateTime(order.createdAt, timezone, i18n.language)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
