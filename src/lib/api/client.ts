'use client'

import { normalizeAuthError } from '@/lib/types/auth'

export type RefreshOutcome = 'ok' | 'invalid_grant' | 'transient'

let refreshPromise: Promise<RefreshOutcome> | null = null

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

function refreshOnce(): Promise<RefreshOutcome> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async (): Promise<RefreshOutcome> => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' })
      if (res.ok) return 'ok'
      // 401 = backend says the refresh token is invalid (expired, revoked,
      // family burned). Anything else (502/500/network) is transient — the
      // refresh cookie is preserved server-side and the user can retry.
      if (res.status === 401) return 'invalid_grant'
      return 'transient'
    } catch {
      return 'transient'
    }
  })().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

async function failAuth(): Promise<never> {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
  throw new AuthError('session_expired', 'Sessão expirada', 401)
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  _isRetry = false
): Promise<T> {
  const res = await fetch(path, init)

  if (res.status === 401 && !_isRetry) {
    const outcome = await refreshOnce()
    if (outcome === 'ok') {
      return apiFetch<T>(path, init, true)
    }
    if (outcome === 'invalid_grant') {
      return failAuth()
    }
    // Transient: do NOT log the user out — surface the error so the caller
    // can retry (or display "tente novamente") without losing the session.
    throw new AuthError('refresh_unavailable', 'Não foi possível renovar a sessão. Tente novamente.', 503)
  }

  if (res.status === 401 && _isRetry) {
    return failAuth()
  }

  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({ error: `http_${res.status}` }))
    const normalized = normalizeAuthError(body)
    throw new AuthError(normalized.code, normalized.message, res.status)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json()
}
