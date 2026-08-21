import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendRemoveMember, backendUpdateMemberRole } from '@/lib/api/members'
import { bffError } from '@/lib/api/bff-error'

interface RouteContext {
  params: Promise<{ userId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { userId } = await context.params
  const body = await request.json().catch(() => ({}))
  if (!body.role) {
    return NextResponse.json(
      { error: 'invalid_request', message: 'role é obrigatório' },
      { status: 400 }
    )
  }
  try {
    await backendUpdateMemberRole(accessToken, userId, body.role)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return bffError(error)
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { userId } = await context.params
  try {
    await backendRemoveMember(accessToken, userId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return bffError(error)
  }
}
