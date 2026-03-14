import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Let everything through — auth is handled client-side by dashboard pages
  // Brand-switching middleware will be re-added when Homes & Livin launches
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/.*).*)'],
}
