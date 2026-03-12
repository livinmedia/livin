// ============================================================
// LIVIN Platform — Cities API Route
// src/app/api/cities/route.ts
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
  const limit  = parseInt(searchParams.get('limit')  || '100')
  const offset = parseInt(searchParams.get('offset') || '0')
  const state  = searchParams.get('state')

  try {
    let query = supabase
      .from('cities')
      .select('id, name, slug, state_region_id, population, is_active, is_top_100')
      .eq('is_active', true)
      .order('population', { ascending: false })
      .range(offset, offset + limit - 1)

    if (state) {
      query = query.eq('state_abbreviation', state.toUpperCase())
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ cities: data, count: data?.length ?? 0 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
