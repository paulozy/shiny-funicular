import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendDeleteTeam, backendUpdateTeam } from '@/lib/api/teams'
import { bffError } from '@/lib/api/bff-error'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Renaming a team. The backend patches only the fields it receives, so an
// absent key leaves that field untouched.
export async function PATCH(request: NextRequest, context: RouteContext) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  const patch: { name?: string; description?: string } = {}
  if (typeof body.name === 'string') patch.name = body.name.trim()
  if (typeof body.description === 'string') patch.description = body.description
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }
  try {
    const team = await backendUpdateTeam(accessToken, id, patch)
    return NextResponse.json(team, { status: 200 })
  } catch (error) {
    return bffError(error)
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await context.params
  try {
    await backendDeleteTeam(accessToken, id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return bffError(error)
  }
}
