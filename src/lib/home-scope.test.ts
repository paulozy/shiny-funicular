import { resolveScope, scopeRepositories } from './home-scope'
import { RepositoryListResponse, RepositoryResponse } from '@/lib/types/repository'

function repo(id: string, teamId?: string): RepositoryResponse {
  return {
    id,
    name: `org/${id}`,
    url: `https://github.com/org/${id}`,
    provider: 'github',
    organization_id: 'org-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...(teamId ? { owner_team: { id: teamId, name: teamId, slug: teamId } } : {}),
  } as RepositoryResponse
}

const catalog: RepositoryListResponse = {
  repositories: [repo('mine', 'team-a'), repo('theirs', 'team-b'), repo('orphan')],
  total: 3,
  limit: 20,
  offset: 0,
}

describe('resolveScope', () => {
  it('honours an explicit scope, in either direction', () => {
    expect(resolveScope('mine', true)).toBe('mine')
    expect(resolveScope('all', false)).toBe('all')
  })

  // An admin's job spans the organization; everyone else starts from what they
  // are accountable for.
  it('defaults an admin to the whole organization', () => {
    expect(resolveScope(undefined, true)).toBe('all')
  })

  it('defaults everyone else to their own teams', () => {
    expect(resolveScope(undefined, false)).toBe('mine')
  })

  // Anything unrecognised falls back to the role default rather than hiding
  // repositories on a typo.
  it.each(['', 'meus-times', 'todos', 'lixo'])('falls back to the role default for %p', (value) => {
    expect(resolveScope(value, true)).toBe('all')
    expect(resolveScope(value, false)).toBe('mine')
  })

  it('takes the first value when the param is repeated', () => {
    expect(resolveScope(['mine', 'all'], true)).toBe('mine')
  })
})

describe('scopeRepositories', () => {
  it('returns the catalog untouched for the organization-wide scope', () => {
    expect(scopeRepositories(catalog, 'all', ['team-a'])).toBe(catalog)
  })

  it('keeps only the repositories owned by the viewer\'s teams', () => {
    const scoped = scopeRepositories(catalog, 'mine', ['team-a'])

    expect(scoped?.repositories.map((r) => r.id)).toEqual(['mine'])
    // The total has to follow, or the counters above the list contradict it.
    expect(scoped?.total).toBe(1)
  })

  it('spans every team the viewer belongs to', () => {
    const scoped = scopeRepositories(catalog, 'mine', ['team-a', 'team-b'])
    expect(scoped?.repositories.map((r) => r.id)).toEqual(['mine', 'theirs'])
  })

  // An unowned repository belongs to nobody — it is a pendency the unscoped
  // view exists to surface, not something that quietly counts as mine.
  it('never counts an unowned repository as the viewer\'s', () => {
    const scoped = scopeRepositories(catalog, 'mine', ['team-a', 'team-b'])
    expect(scoped?.repositories.map((r) => r.id)).not.toContain('orphan')
  })

  // Deliberately empty rather than quietly widening back to everything:
  // silently ignoring the request is what made the filter look broken.
  it('returns nothing when the viewer is on no team', () => {
    const scoped = scopeRepositories(catalog, 'mine', [])
    expect(scoped?.repositories).toEqual([])
    expect(scoped?.total).toBe(0)
  })

  it('passes a null catalog through', () => {
    expect(scopeRepositories(null, 'mine', ['team-a'])).toBeNull()
  })
})
