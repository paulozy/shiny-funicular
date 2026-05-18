import { NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendListDocTemplates } from '@/lib/api/docs'
import { bffError } from '@/lib/api/bff-error'

export async function GET() {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const response = await backendListDocTemplates(token)
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return bffError(error)
  }
}
