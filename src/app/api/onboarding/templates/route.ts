import { NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendListOnboardingTemplates } from '@/lib/api/onboarding'
import { bffError } from '@/lib/api/bff-error'

export async function GET() {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    return NextResponse.json(await backendListOnboardingTemplates(accessToken))
  } catch (error) {
    return bffError(error)
  }
}
