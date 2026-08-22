import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendVerifyOnboardingStep } from '@/lib/api/onboarding'
import { bffError } from '@/lib/api/bff-error'

interface RouteContext {
  params: Promise<{ stepID: string }>
}

// On demand: the check talks to the provider, so it runs when someone asks and
// not on every render of the runner.
export async function POST(_request: NextRequest, context: RouteContext) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { stepID } = await context.params
  try {
    return NextResponse.json(await backendVerifyOnboardingStep(accessToken, stepID))
  } catch (error) {
    return bffError(error)
  }
}
