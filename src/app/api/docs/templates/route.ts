import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendListDocTemplates } from '@/lib/api/docs'
import { bffError } from '@/lib/api/bff-error'
import { DocTemplateScope } from '@/lib/types/docs'

// Scope is forwarded rather than defaulted here: the two galleries want
// different halves of the registry, and picking one for them in the BFF would
// hide that from the caller.
export async function GET(request: NextRequest) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const scope = request.nextUrl.searchParams.get('scope')
    const response = await backendListDocTemplates(
      token,
      scope === 'org' || scope === 'repo' ? (scope as DocTemplateScope) : undefined
    )
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return bffError(error)
  }
}
