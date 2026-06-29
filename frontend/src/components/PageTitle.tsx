import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { resolveRouteLabel } from '../config/routeLabels'

export function usePageTitle(): string {
  const { t } = useTranslation()
  const location = useLocation()
  return resolveRouteLabel(location.pathname, t)
}

export default function PageTitle({
  className = 'text-xl font-bold mb-6',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  const title = usePageTitle()
  return (
    <h1 className={className} {...props}>
      {title}
    </h1>
  )
}
