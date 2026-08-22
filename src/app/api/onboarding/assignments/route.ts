import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendAssignOnboarding, backendListOnboardingAssignments } from '@/lib/api/onboarding'
import { bffError } from '@/lib/api/bff-error'

export async function GET() {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    return NextResponse.json(await backendListOnboardingAssignments(accessToken))
  } catch (error) {
    return bffError(error)
  }
}

export async function POST(request: NextRequest) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  if (!body.flow_id || !body.user_id) {
    return NextResponse.json(
      { error: 'invalid_request', message: 'flow_id e user_id são obrigatórios' },
      { status: 400 }
    )
  }
  try {
    return NextResponse.json(
      await backendAssignOnboarding(accessToken, { flow_id: body.flow_id, user_id: body.user_id }),
      { status: 201 }
    )
  } catch (error) {
    return bffError(error)
  }
}
