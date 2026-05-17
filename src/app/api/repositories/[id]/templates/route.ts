import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import { backendGenerateRepoTemplate } from '@/lib/api/templates'
import { bffError } from '@/lib/api/bff-error'
import { GenerateTemplateRequest } from '@/lib/types/template'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body: GenerateTemplateRequest = await request.json()
    if (!body.prompt || !body.prompt.trim()) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'O prompt é obrigatório.' },
        { status: 400 }
      )
    }

    const response = await backendGenerateRepoTemplate(token, id, body)
    return NextResponse.json(response, { status: 202 })
  } catch (error) {
    return bffError(error)
  }
}
