'use client'

import { normalizeAuthError, NormalizedError } from '@/lib/types/auth'

let isRefreshing = false
let refreshPromise: Promise<void> | null = null

class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  _isRetry = false
): Promise<T> {
  const res = await fetch(path, init)

  if (res.status === 401 && !_isRetry) {
    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = fetch('/api/auth/refresh', { method: 'POST' }).then((r) => {
        if (!r.ok) {
          throw new Error('refresh_failed')
        }
      })
    }

    try {
      if (refreshPromise) {
        await refreshPromise
      }
      return apiFetch(path, init, true)
    } catch {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new AuthError('session_expired', 'Sessão expirada')
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  }

  if (res.status === 401 && _isRetry) {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new AuthError('session_expired', 'Sessão expirada')
  }

  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({ error: `http_${res.status}` }))
    const normalized = normalizeAuthError(body)
    throw new AuthError(normalized.code, normalized.message, res.status)
  }

  if (res.status === 204) {
    return undefined as any
  }

  return res.json()
}
