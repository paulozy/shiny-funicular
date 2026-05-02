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
