import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendMarkOnboardingStep } from '@/lib/api/onboarding'
import { bffError } from '@/lib/api/bff-error'

interface RouteContext {
  params: Promise<{ stepID: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { stepID } = await context.params
  const body = await request.json().catch(() => ({}))
  if (body.status !== 'done' && body.status !== 'skipped') {
    return NextResponse.json(
      { error: 'invalid_request', message: 'status deve ser done ou skipped' },
      { status: 400 }
    )
  }
  try {
    return NextResponse.json(
      await backendMarkOnboardingStep(accessToken, stepID, { status: body.status, note: body.note })
    )
  } catch (error) {
    return bffError(error)
  }
}
