import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendGetDoc, backendUpdateDocContent } from '@/lib/api/docs'
import { bffError } from '@/lib/api/bff-error'
import { UpdateDocContentRequest } from '@/lib/types/docs'

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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body: UpdateDocContentRequest = await request.json()
    if (!body.content || Object.keys(body.content).length === 0) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'O conteúdo a salvar não pode ser vazio.' },
        { status: 400 }
      )
    }
    const response = await backendUpdateDocContent(token, id, body)
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return bffError(error)
  }
}
