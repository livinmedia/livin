/**
 * P0-035 — On-Demand ISR Revalidation Endpoint
 * Route: /api/revalidate
 *
 * Called by the Supabase Edge Function (P0-037) when a content_records
 * row transitions to status = 'published' or 'archived'.
 *
 * Per Doc09 Section 7.3 — SLA: < 60 seconds after status change.
 *
 * Security: protected by REVALIDATE_SECRET env var.
 * The Edge Function must include this secret in the Authorization header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization')
  const secret = process.env.REVALIDATE_SECRET

  if (!secret) {
    console.error('[/api/revalidate] REVALIDATE_SECRET env var not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse payload ──────────────────────────────────────────────────────────
  let body: { citySlug?: string; articleSlug?: string; status?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { citySlug, articleSlug, status } = body

  if (!citySlug) {
    return NextResponse.json({ error: 'citySlug is required' }, { status: 400 })
  }

  const revalidated: string[] = []

  try {
    // Always revalidate city hub page
    revalidatePath(`/${citySlug}`)
    revalidated.push(`/${citySlug}`)

    // Revalidate the specific article page if slug provided
    if (articleSlug) {
      revalidatePath(`/${citySlug}/${articleSlug}`)
      revalidated.push(`/${citySlug}/${articleSlug}`)
    }

    // If archiving, the article path will now return 404 via notFound()
    // No additional action needed — the revalidation clears the cached page

    console.log(`[/api/revalidate] Revalidated paths:`, revalidated, '| status:', status)

    return NextResponse.json({
      revalidated: true,
      paths: revalidated,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[/api/revalidate] Revalidation failed:', err)
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}

// Only POST is accepted
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
