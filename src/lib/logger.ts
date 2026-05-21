import 'server-only'
import { pino } from 'pino'

// Importing this module from a `'use client'` boundary will fail the build
// thanks to `server-only` above — pino includes Node-native bits and must
// never reach the browser bundle. Edge-runtime code (e.g. `src/middleware.ts`)
// must also avoid this module: pino is not compatible with the Edge runtime.
// Use `console.error(JSON.stringify({...}))` from Edge instead.

function defaultLevel(): string {
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL
  if (process.env.NODE_ENV === 'test') return 'silent'
  if (process.env.NODE_ENV === 'production') return 'info'
  return 'debug'
}

export const logger = pino({
  level: defaultLevel(),
  base: { app: 'idp-frontend' },
})

/**
 * Returns a child logger tagged with a stable `trace_id` for the lifetime of
 * an incoming request. Falls back to a fresh UUID when the upstream proxy
 * doesn't propagate `x-request-id`.
 */
export function withTraceId(headers: Headers) {
  const trace_id = headers.get('x-request-id') ?? crypto.randomUUID()
  return logger.child({ trace_id })
}
