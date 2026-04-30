import { NextRequest, NextResponse } from 'next/server'
import { backendLogout } from '@/lib/api/auth'
import { getAccessTokenCookie, clearAuthCookies } from '@/lib/cookies'

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getAccessTokenCookie()

    if (accessToken) {
      await backendLogout(accessToken)
    }

    await clearAuthCookies()

    return NextResponse.json(null, { status: 204 })
  } catch (error) {
    await clearAuthCookies()
    return NextResponse.json(null, { status: 204 })
  }
}
