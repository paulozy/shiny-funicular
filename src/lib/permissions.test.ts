import {
  canConfigureOrganization,
  canCreateRepository,
  canDeleteRepository,
  canManageCoverageTokens,
  hasRole,
  roleOf,
} from './permissions'
import { UserInfo, UserRole } from '@/lib/types/auth'

function user(orgRole: UserRole | null, topRole: UserRole = 'viewer'): UserInfo {
  return {
    id: 'u1',
    email: 'u@example.com',
    full_name: 'U',
    role: topRole,
    organization: orgRole
      ? { id: 'org-1', name: 'Org', slug: 'org', role: orgRole }
      : null,
  }
}

describe('roleOf', () => {
  it('prefers the organization membership role', () => {
    expect(roleOf(user('maintainer', 'viewer'))).toBe('maintainer')
  })

  it('falls back to the top-level role when there is no organization', () => {
    expect(roleOf(user(null, 'admin'))).toBe('admin')
  })

  it('returns null for a missing user', () => {
    expect(roleOf(null)).toBeNull()
    expect(roleOf(undefined)).toBeNull()
  })
})

describe('hasRole', () => {
  it('allows an equal or higher role', () => {
    expect(hasRole(user('developer'), 'developer')).toBe(true)
    expect(hasRole(user('maintainer'), 'developer')).toBe(true)
    expect(hasRole(user('admin'), 'maintainer')).toBe(true)
  })

  it('rejects a lower role', () => {
    expect(hasRole(user('viewer'), 'developer')).toBe(false)
    expect(hasRole(user('developer'), 'maintainer')).toBe(false)
    expect(hasRole(user('maintainer'), 'admin')).toBe(false)
  })

  it('rejects a missing user', () => {
    expect(hasRole(null, 'viewer')).toBe(false)
  })

  // Mirrors the backend guard: an unknown role maps to level 0, below every
  // real role, so it must never be read as privileged.
  it('rejects an unrecognised role', () => {
    expect(hasRole(user('root' as UserRole), 'viewer')).toBe(false)
  })
})

describe('capabilities match the backend route map', () => {
  it('gates repository creation at developer', () => {
    expect(canCreateRepository(user('viewer'))).toBe(false)
    expect(canCreateRepository(user('developer'))).toBe(true)
  })

  it('gates repository deletion at maintainer', () => {
    expect(canDeleteRepository(user('developer'))).toBe(false)
    expect(canDeleteRepository(user('maintainer'))).toBe(true)
  })

  it('gates coverage tokens at maintainer', () => {
    expect(canManageCoverageTokens(user('developer'))).toBe(false)
    expect(canManageCoverageTokens(user('maintainer'))).toBe(true)
  })

  it('gates organization config at admin', () => {
    expect(canConfigureOrganization(user('maintainer'))).toBe(false)
    expect(canConfigureOrganization(user('admin'))).toBe(true)
  })
})
