import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { BiFeedEvent } from '../../services/report'
import { useRegionalStore } from '../../store/useRegionalStore'
import { formatDateTime } from '../../utils/format'

interface BiEventStreamProps {
  events: BiFeedEvent[]
}

const KIND_ICON: Record<BiFeedEvent['kind'], string> = {
  sales_order: '销',
  purchase_order: '采',
  lead_convert: '转',
  audit: '审',
}

export default function BiEventStream({ events }: BiEventStreamProps) {
  const { t, i18n } = useTranslation()
  const { timezone } = useRegionalStore()
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const el = listRef.current
    if (!el || events.length < 4) return

    let paused = false
    el.addEventListener('mouseenter', () => { paused = true })
    el.addEventListener('mouseleave', () => { paused = false })

    const tick = () => {
      if (!paused && el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        el.scrollTop = 0
      } else if (!paused) {
        el.scrollTop += 1
      }
    }
    const timer = setInterval(tick, 50)
    return () => clearInterval(timer)
  }, [events.length])

  if (events.length === 0) {
    return <div className="bi-screen__events-empty">{t('bi.noEvents')}</div>
  }

  return (
    <ul ref={listRef} className="bi-screen__events">
      {events.map((ev) => (
        <li key={ev.id} className={`bi-screen__event bi-screen__event--${ev.kind}`}>
          <span className="bi-screen__event-badge">{KIND_ICON[ev.kind]}</span>
          <div className="bi-screen__event-body">
            <div className="bi-screen__event-top">
              <span className="bi-screen__event-title">{ev.title}</span>
              {ev.amount != null ? (
                <span className="bi-screen__event-amount">
                  {ev.amount.toLocaleString(i18n.language)} {t('units.currency')}
                </span>
              ) : null}
            </div>
            <div className="bi-screen__event-meta">
              <span>{t(`bi.eventKind.${ev.kind}`)}</span>
              {ev.detail ? <span> · {ev.detail}</span> : null}
              {ev.actor ? <span> · {ev.actor}</span> : null}
              {ev.status ? (
                <span className="bi-screen__event-status">
                  {' '}· {t(`status.${ev.status}`, { defaultValue: ev.status })}
                </span>
              ) : null}
            </div>
          </div>
          <time className="bi-screen__event-time">
            {formatDateTime(ev.createdAt, timezone, i18n.language)}
          </time>
        </li>
      ))}
    </ul>
  )
}
