import {
  ROUTE_I18N_KEYS,
  MODULE_I18N_KEYS,
  matchRoutePath,
} from './routeI18n'

/** @deprecated Use routeLabel() with i18n t() instead */
export const ROUTE_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(ROUTE_I18N_KEYS).map(([path, key]) => [path, key]),
)

export function resolveRouteLabel(pathname: string, t: (key: string) => string): string {
  const matched = matchRoutePath(pathname)
  return matched ? t(ROUTE_I18N_KEYS[matched]) : t('common.page')
}

export function getBreadcrumbItems(
  pathname: string,
  t: (key: string) => string,
): { title: string; path?: string }[] {
  const items: { title: string; path?: string }[] = [
    { title: t('common.home'), path: '/dashboard' },
  ]

  const matched = matchRoutePath(pathname)

  if (!matched || matched === '/dashboard') {
    if (pathname === '/' || pathname === '/dashboard') {
      items.push({ title: t('routes.dashboard') })
    }
    return items
  }

  const moduleKey = matched.split('/')[1]
  const moduleI18nKey = MODULE_I18N_KEYS[moduleKey]
  if (moduleI18nKey) {
    items.push({ title: t(moduleI18nKey) })
  }

  items.push({ title: t(ROUTE_I18N_KEYS[matched]) })
  return items
}
