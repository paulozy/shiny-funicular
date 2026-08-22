import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendCreateGlossaryTerm, backendListGlossaryTerms } from '@/lib/api/onboarding'
import { bffError } from '@/lib/api/bff-error'

export async function GET() {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    return NextResponse.json(await backendListGlossaryTerms(accessToken))
  } catch (error) {
    return bffError(error)
  }
}

export async function POST(request: NextRequest) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  if (!body.term?.trim() || !body.definition?.trim()) {
    return NextResponse.json(
      { error: 'invalid_request', message: 'termo e definição são obrigatórios' },
      { status: 400 }
    )
  }
  try {
    return NextResponse.json(
      await backendCreateGlossaryTerm(accessToken, {
        term: body.term.trim(),
        definition: body.definition.trim(),
      }),
      { status: 201 }
    )
  } catch (error) {
    return bffError(error)
  }
}
