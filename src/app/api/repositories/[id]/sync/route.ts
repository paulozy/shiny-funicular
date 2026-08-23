import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendSyncRepository } from '@/lib/api/repositories'
import { withTraceId } from '@/lib/logger'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Fire-and-forget from the repo view: refreshes repo metadata (PR/issue counts,
// stars, branches, …) in the background. The backend throttles repeated calls.
export async function POST(request: NextRequest, context: RouteContext) {
  const log = withTraceId(request.headers)
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const response = await backendSyncRepository(token, id)
    // The body's `status` is the whole point now — `queued`, `throttled` or
    // `already_syncing` — so it is forwarded verbatim. A dead queue never reaches
    // here: the backend answers 503 and the catch below carries that through.
    return NextResponse.json(response, { status: 202 })
  } catch (error) {
    const legacy = error as { statusCode?: number; errorResponse?: { error?: string } }
    const statusCode = legacy.statusCode || 500
    const message = error instanceof Error ? error.message : 'unknown_error'
    log.error({ status: statusCode }, 'repo_sync_route_error')
    return NextResponse.json(
      { error: legacy.errorResponse?.error || 'server_error', message },
      { status: statusCode }
    )
  }
}
