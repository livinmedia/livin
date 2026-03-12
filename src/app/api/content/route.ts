// ============================================================
// LIVIN Platform — Content API Route
// src/app/api/content/route.ts
// P0-027: force-dynamic — never cache API responses
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// P0-027: API routes must always be dynamic — never stale-cached
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const citySlug = searchParams.get('city')
  const brand    = searchParams.get('brand')
  const limit    = parseInt(searchParams.get('limit') || '10')

  if (!citySlug) {
    return NextResponse.json({ error: 'city parameter required' }, { status: 400 })
  }

  try {
    // Resolve city ID from slug
    const { data: city } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 })
    }

    let query = supabase
      .from('content_records')
      .select('id, title, slug, content_type, status, published_at, meta_description')
      .eq('city_id', city.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit)

    if (brand) {
      query = query.eq('brand', brand)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ content: data, count: data?.length ?? 0 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
