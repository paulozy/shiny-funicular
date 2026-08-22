import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendReplaceOnboardingSteps } from '@/lib/api/onboarding'
import { bffError } from '@/lib/api/bff-error'

interface RouteContext {
  params: Promise<{ id: string }>
}

// The whole list, in order. Steps that already exist carry their id, which is
// what keeps their progress rows alive across an edit.
export async function PUT(request: NextRequest, context: RouteContext) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  if (!Array.isArray(body.steps)) {
    return NextResponse.json({ error: 'invalid_request', message: 'steps deve ser uma lista' }, { status: 400 })
  }
  try {
    return NextResponse.json(await backendReplaceOnboardingSteps(accessToken, id, body.steps))
  } catch (error) {
    return bffError(error)
  }
}
