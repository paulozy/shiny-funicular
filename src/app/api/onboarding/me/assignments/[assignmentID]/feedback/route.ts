import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendSubmitOnboardingFeedback } from '@/lib/api/onboarding'
import { bffError } from '@/lib/api/bff-error'

interface RouteContext {
  params: Promise<{ assignmentID: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { assignmentID } = await context.params
  const body = await request.json().catch(() => ({}))
  if (!body.feedback?.trim()) {
    return NextResponse.json({ error: 'invalid_request', message: 'escreva algo antes de enviar' }, { status: 400 })
  }
  try {
    await backendSubmitOnboardingFeedback(accessToken, assignmentID, { feedback: body.feedback.trim() })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return bffError(error)
  }
}
