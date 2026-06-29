import { describe, it, expect } from 'vitest'
import { canAccessRoute, resolveRoutePath } from './routePermissions'

describe('routePermissions', () => {
  const hasPermission =
    (...owned: string[]) =>
    (...required: string[]) =>
      required.some((code) => owned.includes(code))

  it('resolves exact paths', () => {
    expect(resolveRoutePath('/finance/gl')).toBe('/finance/gl')
  })

  it('allows dashboard without permissions', () => {
    expect(canAccessRoute('/dashboard', hasPermission())).toBe(true)
  })

  it('denies finance when missing permission', () => {
    expect(canAccessRoute('/finance/gl', hasPermission())).toBe(false)
  })

  it('allows finance with matching permission', () => {
    expect(canAccessRoute('/finance/gl', hasPermission('finance:gl'))).toBe(true)
  })

  it('allows receive with order permission', () => {
    expect(
      canAccessRoute('/procurement/receive', hasPermission('procurement:order')),
    ).toBe(true)
  })

  it('allows system user with view permission', () => {
    expect(canAccessRoute('/system/user', hasPermission('user:view'))).toBe(true)
  })
})
