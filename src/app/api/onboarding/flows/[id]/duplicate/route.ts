import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendDuplicateOnboardingFlow } from '@/lib/api/onboarding'
import { bffError } from '@/lib/api/bff-error'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, context: RouteContext) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await context.params
  try {
    return NextResponse.json(await backendDuplicateOnboardingFlow(accessToken, id), { status: 201 })
  } catch (error) {
    return bffError(error)
  }
}
