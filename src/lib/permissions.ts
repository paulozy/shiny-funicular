import { UserInfo, UserRole } from '@/lib/types/auth'

/**
 * Frontend mirror of the backend role hierarchy
 * (`internal/utils/auth.go:HasPermission`). Keep the two in sync: this module
 * only decides what to *render*, the API is what actually enforces. Hiding a
 * control the API would reject is a UX nicety; showing one it would reject is
 * the bug this exists to prevent.
 */
const ROLE_LEVELS: Record<UserRole, number> = {
  viewer: 1,
  developer: 2,
  maintainer: 3,
  admin: 4,
}

/**
 * The role the API authorizes on is the organization membership role
 * (`claims.OrganizationRole`), which `/users/me` returns under
 * `organization.role`. The top-level `user.role` currently carries the same
 * value, so it serves as a fallback for tokens minted before that field
 * existed.
 */
export function roleOf(user: Pick<UserInfo, 'role' | 'organization'> | null | undefined): UserRole | null {
  return user?.organization?.role ?? user?.role ?? null
}

/** True when the user's role sits at or above `minRole` in the hierarchy. */
export function hasRole(
  user: Pick<UserInfo, 'role' | 'organization'> | null | undefined,
  minRole: UserRole
): boolean {
  const role = roleOf(user)
  if (!role) return false
  // An unrecognised role must never be treated as privileged.
  const level = ROLE_LEVELS[role] ?? 0
  return level >= ROLE_LEVELS[minRole]
}

type Actor = Pick<UserInfo, 'role' | 'organization'> | null | undefined

// Named capabilities, one per gated route in internal/api/routes.go. Callers
// should use these rather than comparing roles inline, so a change to the
// backend's role map has a single place to land here.

export const canCreateRepository = (user: Actor) => hasRole(user, 'developer')
export const canSyncRepository = (user: Actor) => hasRole(user, 'developer')
export const canManageRelationships = (user: Actor) => hasRole(user, 'developer')
export const canGenerateDocs = (user: Actor) => hasRole(user, 'developer')
export const canEditDocs = (user: Actor) => hasRole(user, 'developer')

export const canEditRepository = (user: Actor) => hasRole(user, 'maintainer')
export const canDeleteRepository = (user: Actor) => hasRole(user, 'maintainer')
export const canManageCoverageTokens = (user: Actor) => hasRole(user, 'maintainer')

export const canConfigureOrganization = (user: Actor) => hasRole(user, 'admin')
export const canManageMembers = (user: Actor) => hasRole(user, 'admin')
export const canGenerateOrgDocs = (user: Actor) => hasRole(user, 'admin')
