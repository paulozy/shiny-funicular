import { NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendListMembers } from '@/lib/api/members'
import { bffError } from '@/lib/api/bff-error'

export async function GET() {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    return NextResponse.json(await backendListMembers(accessToken))
  } catch (error) {
    return bffError(error)
  }
}
