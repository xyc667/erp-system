import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRegionalStore } from '../../store/useRegionalStore'
import { formatDateTime } from '../../utils/format'

/** 独立时钟，避免每秒刷新整个大屏 */
export default function BiScreenClock() {
  const { i18n } = useTranslation()
  const { timezone } = useRegionalStore()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(clock)
  }, [])

  return (
    <div className="bi-screen__clock">
      {formatDateTime(now, timezone, i18n.language)}
    </div>
  )
}
