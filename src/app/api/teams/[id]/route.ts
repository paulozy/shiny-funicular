import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendDeleteTeam } from '@/lib/api/teams'
import { bffError } from '@/lib/api/bff-error'

interface RouteContext {
  params: Promise<{ id: string }>
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
