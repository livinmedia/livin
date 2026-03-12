// ============================================================
// LIVIN Platform — Domain-Aware Middleware
// Doc 2: Section 4.1 — Domain-Aware Middleware
// P0-022 (brand detection) + P0-029 (redirect rules)
// ============================================================
// Runs before EVERY route handler on every request.
// Redirect rule execution order:
//   1. .com → .in  (domain-level, fires first)
//   2. Trailing slash removal
//   3. Uppercase → lowercase
//   4. State abbreviation expansion (/houston-tx → /houston-texas)
//   5. Underscores → hyphens (/houston_texas → /houston-texas)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { parseBrandContext, Brand } from '@/lib/routing/brand-context'
import { normalizeIncomingSlug } from '@/lib/routing/slug-normalizer'

// ── .com → .in domain map (P0-029) ───────────────────────────────────────
// All .com variants redirect permanently to their .in equivalents.
// This covers direct .com attempts AND any subdomain of .com domains.
const COM_TO_IN_MAP: Record<string, string> = {
  'livin.com':             'livin.in',
  'homesandlivin.com':     'homesandlivin.in',
  'homes-and-livin.com':   'homesandlivin.in',
  'livinplatform.com':     'livin.in',
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // ── Step 1: .com → .in redirect (P0-029) ──────────────────────────────────
  // Must fire BEFORE brand context parsing — .com domains return null from
  // parseBrandContext and would fall through to a 404 without this intercept.
  // Handles: livin.com, homesandlivin.com, and any subdomains thereof.
  const hostWithoutPort = hostname.split(':')[0]

  // Check exact .com domain match
  const directComTarget = COM_TO_IN_MAP[hostWithoutPort]
  if (directComTarget) {
    const inUrl = `https://${directComTarget}${pathname}${search}`
    return NextResponse.redirect(inUrl, { status: 301 })
  }

  // Check subdomain of a .com domain (e.g. create.livin.com → create.livin.in)
  for (const [comDomain, inDomain] of Object.entries(COM_TO_IN_MAP)) {
    if (hostWithoutPort.endsWith(`.${comDomain}`)) {
      const subdomain = hostWithoutPort.replace(`.${comDomain}`, '')
      const inUrl = `https://${subdomain}.${inDomain}${pathname}${search}`
      return NextResponse.redirect(inUrl, { status: 301 })
    }
  }

  // ── Step 2: Parse brand context from hostname ──────────────────────────────
  const brandContext = parseBrandContext(hostname)

  // Unknown domain → 404
  if (!brandContext) {
    return NextResponse.rewrite(new URL('/404', request.url))
  }

  const { brand, subdomain } = brandContext

  // ── Step 3: Enforce trailing slash removal (P0-029) ───────────────────────
  // Doc 2, Section 8.2 — trailing slash → 301 redirect
  if (pathname !== '/' && pathname.endsWith('/')) {
    const cleanPath = pathname.slice(0, -1)
    return NextResponse.redirect(
      new URL(`${cleanPath}${search}`, request.url),
      { status: 301 }
    )
  }

  // ── Step 4: Enforce lowercase URLs (P0-029) ───────────────────────────────
  // Doc 2, Section 8.2 — uppercase → 301 redirect
  if (pathname !== pathname.toLowerCase()) {
    return NextResponse.redirect(
      new URL(`${pathname.toLowerCase()}${search}`, request.url),
      { status: 301 }
    )
  }

  // ── Step 5: Handle subdomain routing ──────────────────────────────────────

  if (subdomain) {
    // create.livin.in or create.homesandlivin.in → submission portal (auth required)
    if (subdomain === 'create') {
      const response = NextResponse.next()
      response.headers.set('x-brand', brand)
      response.headers.set('x-subdomain', 'create')
      response.headers.set('x-require-auth', 'true')
      return response
    }

    // api.livin.in or api.homesandlivin.in → internal API handlers
    if (subdomain === 'api') {
      const response = NextResponse.next()
      response.headers.set('x-brand', brand)
      response.headers.set('x-subdomain', 'api')
      return response
    }

    // app.homesandlivin.in → HomeStack integration endpoint
    if (subdomain === 'app' && brand === Brand.HOMES_AND_LIVIN) {
      const response = NextResponse.next()
      response.headers.set('x-brand', brand)
      response.headers.set('x-subdomain', 'app')
      return response
    }

    // [state].homesandlivin.in → GHL email subdomain (no web content)
    // These are email infrastructure only — return 404 for web requests
    if (brand === Brand.HOMES_AND_LIVIN && /^[a-z]{2}$/.test(subdomain)) {
      return NextResponse.rewrite(new URL('/404', request.url))
    }

    // Any other subdomain → 404
    return NextResponse.rewrite(new URL('/404', request.url))
  }

  // ── Step 6: Handle path-level slug normalization (P0-029) ─────────────────
  // Only applies to paths with segments (not root /)
  if (pathname !== '/') {
    const segments = pathname.split('/').filter(Boolean)
    const firstSegment = segments[0]

    if (firstSegment) {
      const { normalizedSlug, wasAbbreviated } = normalizeIncomingSlug(firstSegment)

      // Doc 2, Section 8.2 — state abbreviation expansion → 301 redirect
      // e.g. /houston-tx → /houston-texas
      if (wasAbbreviated) {
        const remainingPath = segments.slice(1).join('/')
        const newPath = remainingPath
          ? `/${normalizedSlug}/${remainingPath}`
          : `/${normalizedSlug}`
        return NextResponse.redirect(
          new URL(`${newPath}${search}`, request.url),
          { status: 301 }
        )
      }

      // Normalize underscores → hyphens: /houston_texas → /houston-texas
      if (firstSegment.includes('_')) {
        const remainingPath = segments.slice(1).join('/')
        const newPath = remainingPath
          ? `/${normalizedSlug}/${remainingPath}`
          : `/${normalizedSlug}`
        return NextResponse.redirect(
          new URL(`${newPath}${search}`, request.url),
          { status: 301 }
        )
      }
    }
  }

  // ── Step 7: Set brand context headers for all downstream components ────────
  // These headers are read by layouts, pages, and API routes to know which
  // brand is active without re-parsing the hostname every time.
  const response = NextResponse.next()
  response.headers.set('x-brand', brand)
  response.headers.set('x-hostname', hostname)
  response.headers.set('x-pathname', pathname)

  return response
}

// ── Matcher: Run middleware on all routes except static assets ─────────────
// Excludes Next.js internals and static files for performance
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}