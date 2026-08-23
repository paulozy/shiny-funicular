// Types for the repository contributors exposed by the backend.
//
// Sources of truth (backend):
// - integrations/scm/types.go:      Contributor
// - models/contributor_dto.go:      ContributorResponse / ContributorListResponse
// - handlers/repository_browse.go:  GET /repositories/:id/contributors

export interface ContributorResponse {
  /**
   * The provider username. GitHub reports one and no display name; GitLab
   * reports a display name and no username. Render whichever arrived — see
   * `contributorLabel`.
   */
  login?: string
  name?: string
  avatar_url?: string
  commits: number
  /**
   * Both are nullable because neither provider reports them on the
   * contributors endpoint — the backend derives them, and `null` means it
   * could not, which is a different claim from 0. The UI must omit the
   * segment rather than render a zero it did not measure.
   */
  open_change_requests: number | null
  last_commit_at: string | null
}

export interface ContributorListResponse {
  items: ContributorResponse[]
  total: number
}

/** The best identity the provider gave us, preferring the human name. */
export function contributorLabel(contributor: ContributorResponse): string {
  return contributor.name || contributor.login || 'Desconhecido'
}
