import { NextRequest, NextResponse } from 'next/server'
import { getOAuthRedirectURL } from '@/lib/api/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const organizationName = request.nextUrl.searchParams.get('organization_name') || undefined

    const backendUrl = getOAuthRedirectURL(provider, organizationName)
    return NextResponse.redirect(backendUrl)
  } catch (error) {
    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', 'oauth_failed')
    return NextResponse.redirect(errorUrl)
  }
}
