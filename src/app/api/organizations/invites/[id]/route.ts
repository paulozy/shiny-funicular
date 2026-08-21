import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendRevokeInvite } from '@/lib/api/members'
import { bffError } from '@/lib/api/bff-error'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { id } = await context.params
  try {
    await backendRevokeInvite(accessToken, id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return bffError(error)
  }
}
