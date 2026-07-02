import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { resolveRouteLabel } from '../config/routeLabels'
import { brand } from '../theme/brand'

export function usePageTitle(): string {
  const { t } = useTranslation()
  const location = useLocation()
  return resolveRouteLabel(location.pathname, t)
}

export default function PageTitle({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  const title = usePageTitle()
  return (
    <h1
      className={className}
      style={{
        fontSize: 20,
        fontWeight: 700,
        color: brand.primary,
        marginBottom: 20,
        marginTop: 0,
        letterSpacing: '-0.01em',
        ...style,
      }}
      {...props}
    >
      {title}
    </h1>
  )
}
