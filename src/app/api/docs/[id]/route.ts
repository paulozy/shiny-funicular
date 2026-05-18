import { NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendGetDoc } from '@/lib/api/docs'
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
    const response = await backendGetDoc(token, id)
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return bffError(error)
  }
}
