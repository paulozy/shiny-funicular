import 'server-only'
import { cache } from 'react'
import { backendGetMe } from './auth'
import { backendGetRepositories } from './repositories'
import { RepositoryListResponse } from '@/lib/types/repository'
import { UserInfo } from '@/lib/types/auth'

/**
 * Per-request memoisation for the two calls every page in the app makes.
 *
 * A layout and the page it wraps render in the same server request, and both
 * needed the session and the catalog: opening a repository cost four upstream
 * calls where two would do — `/auth/me` and `/repositories` twice each. React's
 * `cache()` collapses identical calls within one request (and only within one:
 * nothing is shared between users or between navigations, so no page can serve
 * another person's session).
 */

/** The catalog page size used by every lookup-by-id call site. */
const CATALOG_LIMIT = 100

export const getSessionUser = cache(
  async (accessToken: string): Promise<UserInfo | null> =>
    backendGetMe(accessToken).catch(() => null)
)

export const listRepositories = cache(
  async (accessToken: string): Promise<RepositoryListResponse | null> =>
    backendGetRepositories(accessToken, { limit: CATALOG_LIMIT, offset: 0 }).catch(() => null)
)
