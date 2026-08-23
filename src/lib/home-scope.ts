import { RepositoryListResponse } from '@/lib/types/repository'

/**
 * Which slice of the catalog the dashboard is showing.
 *
 * `all` is the whole organization — an IDP catalog is organization-wide,
 * because discovering services you are *not* on the hook for is most of the
 * point. `mine` narrows the view only; it never changes what anyone is allowed
 * to see or do. Team ownership decides who may *change* a repository, and the
 * API enforces that, not this.
 */
export type HomeScope = 'all' | 'mine'

/** The query parameter. English, like the rest of the codebase's identifiers. */
export const SCOPE_PARAM = 'scope'

/**
 * Resolve the scope from the URL, falling back to the role's default.
 *
 * Admins default to the whole organization: their job spans it. Everyone else
 * defaults to their own teams, which is the view that matches what they are
 * accountable for. An explicit parameter always wins, in either direction —
 * including for someone on no team, whose `mine` view is legitimately empty and
 * says so rather than being silently ignored.
 */
export function resolveScope(raw: string | string[] | undefined, isAdmin: boolean): HomeScope {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value === 'mine') return 'mine'
  if (value === 'all') return 'all'
  return isAdmin ? 'all' : 'mine'
}

/**
 * Narrow a catalog to the repositories owned by the given teams.
 *
 * A repository with no owning team is not "mine": it belongs to nobody, which
 * is a pendency the organization-wide view exists to surface.
 *
 * No teams yields no repositories, deliberately. Quietly widening back to the
 * whole catalog would make the control look broken — which is exactly the bug
 * this replaced. The caller renders an empty state that explains it instead.
 */
export function scopeRepositories(
  repos: RepositoryListResponse | null,
  scope: HomeScope,
  myTeamIds: string[]
): RepositoryListResponse | null {
  if (repos === null || scope === 'all') {
    return repos
  }
  const mine = new Set(myTeamIds)
  const repositories = repos.repositories.filter(
    (repo) => repo.owner_team !== undefined && mine.has(repo.owner_team.id)
  )
  return { ...repos, repositories, total: repositories.length }
}
