import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendSetRepositoryOwner } from '@/lib/api/teams'
import { bffError } from '@/lib/api/bff-error'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  // team_id: null is meaningful — it clears the owner.
  const teamID = typeof body.team_id === 'string' && body.team_id ? body.team_id : null
  try {
    await backendSetRepositoryOwner(accessToken, id, teamID)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return bffError(error)
  }
}
