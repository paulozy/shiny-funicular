import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: [
    '/',
    '/((?!login|register|cadastro|selecionar-organizacao|auth|_next|.*\\..*).)*',
  ],
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Rotas públicas
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/cadastro' ||
    pathname === '/selecionar-organizacao' ||
    pathname.startsWith('/auth/')
  ) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get('access_token')?.value

  if (!accessToken) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}
