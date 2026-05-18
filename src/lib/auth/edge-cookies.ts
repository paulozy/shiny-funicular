/**
 * Edge-safe cookie helpers for auth tokens. Importable from both the Node
 * runtime (Route Handlers) and the Edge runtime (middleware). Do NOT import
 * `next/headers` here — that module is server-only and breaks in middleware.
 *
 * The Node-runtime helpers in `src/lib/cookies.ts` wrap `cookies()`
 * (next/headers) and use these constants/options so attributes stay in sync.
 */

export const COOKIE_ACCESS_TOKEN = 'access_token'
export const COOKIE_REFRESH_TOKEN = 'refresh_token'
export const COOKIE_LOGIN_TICKET = 'login_ticket'

/**
 * User preference cookie controlling whether the sidebar starts collapsed
 * (`'collapsed'`) or expanded. Read by `(app)/layout.tsx` server-side so the
 * markup matches between SSR and the first client render (no hydration mismatch).
 */
export const COOKIE_SIDEBAR_STATE = 'sidebar_state'

export interface AuthCookieOptions {
  httpOnly: true
  sameSite: 'lax'
  secure: boolean
  path: '/'
  maxAge: number
}

export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Returns the standard cookie attribute set used for `access_token` and
 * `refresh_token`. `maxAgeSeconds` is the lifetime in seconds (the backend
 * returns `expires_in` / `refresh_expires_in` in seconds already).
 */
export function buildAuthCookieOptions(maxAgeSeconds: number): AuthCookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProductionEnv(),
    path: '/',
    maxAge: maxAgeSeconds,
  }
}
