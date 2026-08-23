import { RepoProvider } from '@/lib/types/repository'

// Types matching the backend's coverage upload token endpoints
// (POST/GET/DELETE /api/v1/repositories/:id/coverage/tokens).

export interface CoverageToken {
  id: string
  name: string
  last_used_at?: string | null
  expires_at?: string | null
  revoked_at?: string | null
  created_at: string
}

// Returned ONLY by POST /coverage/tokens. The plaintext `token` is shown a
// single time and never recoverable afterwards.
export interface CoverageTokenWithSecret extends CoverageToken {
  token: string // cov_<hex...>
}

export interface CreateCoverageTokenRequest {
  name: string
  expires_at?: string // ISO 8601, optional
}

// Served by GET /api/v1/repositories/:id/coverage/setup.
//
// Facts, not a rendered snippet: the format selector and the report path are
// editable, so the client composes the YAML from these. What the client cannot
// know on its own is here — the platform's public URL, whether a CI runner could
// even reach it, which CI the repository already uses, and whether any upload has
// ever arrived.
export interface CoverageSetup {
  /** Resolved as organization override → platform config. Absent when neither is set. */
  base_url?: string
  /** Full URL to POST to, repository id already in it. Absent when unreachable. */
  ingest_url?: string
  repository_id: string
  /**
   * False when the platform has no publicly reachable URL. The panel must then
   * render NO snippet and say why — a CI step pointing at localhost fails on
   * every run, which is the silent breakage this whole endpoint exists to end.
   */
  reachable: boolean
  provider: RepoProvider
  /** e.g. `ci.github_actions`, `ci.gitlab`. Absent means unknown, not "none". */
  ci_system?: string
  ci_config_path?: string
  /** Tri-state: absent means the tree could not be fully inspected. */
  has_ci?: boolean
  default_branch?: string
  suggestion: CoverageSuggestion
  /** Every format the ingest endpoint accepts, so a selector cannot offer a 415. */
  formats: string[]
  /** The one value that has to be a CI secret. The other two are not sensitive. */
  secret_env_name: string
  headers: CoverageSetupHeaders
  has_active_token: boolean
  last_upload_at?: string | null
}

/** A starting point, never a fact — every field stays editable in the UI. */
export interface CoverageSuggestion {
  language?: string
  format: string
  report_path: string
  test_command?: string
}

export interface CoverageSetupHeaders {
  format: string
  commit: string
  branch: string
}
