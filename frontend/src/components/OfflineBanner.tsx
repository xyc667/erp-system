import { useEffect, useState } from 'react'
import { Alert } from 'antd'
import { useTranslation } from 'react-i18next'

export default function OfflineBanner() {
  const { t } = useTranslation()
  const [online, setOnline] = useState(navigator.onLine)
  const [showOnlineToast, setShowOnlineToast] = useState(false)

  useEffect(() => {
    const onOnline = () => {
      setOnline(true)
      setShowOnlineToast(true)
      const timer = setTimeout(() => setShowOnlineToast(false), 3000)
      return () => clearTimeout(timer)
    }
    const onOffline = () => setOnline(false)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (online && !showOnlineToast) return null

  return (
    <Alert
      type={online ? 'success' : 'warning'}
      showIcon
      banner
      message={online ? t('pwa.online') : t('pwa.offline')}
      className="mb-0"
    />
  )
}
