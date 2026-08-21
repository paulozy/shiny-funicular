import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendCreateInvite, backendListInvites } from '@/lib/api/members'
import { bffError } from '@/lib/api/bff-error'

export async function GET() {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    return NextResponse.json(await backendListInvites(accessToken))
  } catch (error) {
    return bffError(error)
  }
}

export async function POST(request: NextRequest) {
  const accessToken = await getAccessTokenCookie()
  if (!accessToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  if (!body.email?.trim()) {
    return NextResponse.json(
      { error: 'invalid_request', message: 'email é obrigatório' },
      { status: 400 }
    )
  }
  try {
    const created = await backendCreateInvite(accessToken, {
      email: body.email.trim(),
      role: body.role,
      ttl_hours: body.ttl_hours,
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return bffError(error)
  }
}
