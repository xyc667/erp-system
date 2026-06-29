import { Result, Button } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/useAuthStore'
import { canAccessRoute } from '../config/routePermissions'

export default function PermissionRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const hasPermission = useAuthStore((state) => state.hasPermission)

  if (!canAccessRoute(location.pathname, hasPermission)) {
    return (
      <Result
        status="403"
        title="403"
        subTitle={t('errors.forbiddenPage')}
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            {t('common.backHome')}
          </Button>
        }
      />
    )
  }

  return <>{children}</>
}
