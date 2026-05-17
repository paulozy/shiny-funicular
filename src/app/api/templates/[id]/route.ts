import { NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendGetTemplate } from '@/lib/api/templates'
import { bffError } from '@/lib/api/bff-error'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const response = await backendGetTemplate(token, id)
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return bffError(error)
  }
}
