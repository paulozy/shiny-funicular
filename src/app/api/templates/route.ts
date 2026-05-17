import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenCookie } from '@/lib/cookies'
import {
  backendGenerateTemplate,
  backendListTemplates,
} from '@/lib/api/templates'
import { bffError } from '@/lib/api/bff-error'
import { GenerateTemplateRequest, TemplateStatus } from '@/lib/types/template'

export async function GET(request: NextRequest) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pinnedRaw = searchParams.get('pinned')
    const statusRaw = searchParams.get('status')
    const limitRaw = searchParams.get('limit')
    const offsetRaw = searchParams.get('offset')

    const response = await backendListTemplates(token, {
      pinned: pinnedRaw === null ? undefined : pinnedRaw === 'true',
      status: (statusRaw as TemplateStatus) || undefined,
      limit: limitRaw ? parseInt(limitRaw, 10) : undefined,
      offset: offsetRaw ? parseInt(offsetRaw, 10) : undefined,
    })
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return bffError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getAccessTokenCookie()
    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body: GenerateTemplateRequest = await request.json()
    if (!body.prompt || !body.prompt.trim()) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'O prompt é obrigatório.' },
        { status: 400 }
      )
    }

    const response = await backendGenerateTemplate(token, body)
    return NextResponse.json(response, { status: 202 })
  } catch (error) {
    return bffError(error)
  }
}
