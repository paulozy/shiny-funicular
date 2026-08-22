import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendCreateOnboardingFlow, backendListOnboardingFlows } from '@/lib/api/onboarding'
import { bffError } from '@/lib/api/bff-error'

export async function GET() {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    return NextResponse.json(await backendListOnboardingFlows(accessToken))
  } catch (error) {
    return bffError(error)
  }
}

export async function POST(request: NextRequest) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'invalid_request', message: 'nome é obrigatório' }, { status: 400 })
  }
  try {
    const flow = await backendCreateOnboardingFlow(accessToken, {
      name: body.name.trim(),
      description: body.description,
      is_default: body.is_default,
      template_id: body.template_id,
    })
    return NextResponse.json(flow, { status: 201 })
  } catch (error) {
    return bffError(error)
  }
}
