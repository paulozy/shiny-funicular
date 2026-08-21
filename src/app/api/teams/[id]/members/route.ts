import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendAddTeamMember, backendListTeamMembers } from '@/lib/api/teams'
import { bffError } from '@/lib/api/bff-error'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await context.params
  try {
    return NextResponse.json(await backendListTeamMembers(accessToken, id))
  } catch (error) {
    return bffError(error)
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  if (!body.user_id) {
    return NextResponse.json({ error: 'invalid_request', message: 'user_id é obrigatório' }, { status: 400 })
  }
  try {
    await backendAddTeamMember(accessToken, id, body.user_id, body.role)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return bffError(error)
  }
}
