'use client'

import { normalizeAuthError } from '@/lib/types/auth'

let refreshPromise: Promise<boolean> | null = null

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

function refreshOnce(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' })
      return res.ok
    } catch {
      return false
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
    const ok = await refreshOnce()
    if (!ok) return failAuth()
    return apiFetch<T>(path, init, true)
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
    return undefined as any
  }

  return res.json()
}
