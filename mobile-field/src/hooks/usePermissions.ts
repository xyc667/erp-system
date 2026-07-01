import { useAuth } from '../context/AuthContext'

export function usePermissions() {
  const { user } = useAuth()
  const permissions = user?.permissions ?? []

  const has = (code: string) => permissions.includes(code)
  const hasAny = (...codes: string[]) => codes.some((c) => permissions.includes(c))

  return {
    permissions,
    has,
    hasAny,
    canReview: hasAny('lead:review', 'lead:manage'),
    canReport: has('lead:report'),
  }
}
