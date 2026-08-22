import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import {
  backendDeleteOnboardingFlow,
  backendGetOnboardingFlow,
  backendUpdateOnboardingFlow,
} from '@/lib/api/onboarding'
import { bffError } from '@/lib/api/bff-error'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await context.params
  try {
    return NextResponse.json(await backendGetOnboardingFlow(accessToken, id))
  } catch (error) {
    return bffError(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  try {
    return NextResponse.json(await backendUpdateOnboardingFlow(accessToken, id, body))
  } catch (error) {
    return bffError(error)
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await context.params
  try {
    await backendDeleteOnboardingFlow(accessToken, id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return bffError(error)
  }
}
