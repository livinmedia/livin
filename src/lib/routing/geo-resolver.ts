// ============================================================
// LIVIN Platform — Geo Resolver
// Doc 2: Section 4.2.2 — Single-Segment Geo Disambiguation
// ============================================================
// Resolves a URL slug to its geographic level by querying
// Supabase in priority order: city → state → country
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export type GeoLevel = 'city' | 'state' | 'country'

export type GeoResult = {
  level: GeoLevel
  slug: string
  name: string
  id: string
}

/**
 * Resolves a URL slug to its geographic level.
 * Doc 2, Section 4.2.2 — prioritized lookup sequence.
 *
 * Query order:
 *   1. cities table (highest priority — primary content unit)
 *   2. states_regions table
 *   3. countries table
 *   4. null → 404
 *
 * Examples:
 *   'houston-texas'    -> { level: 'city', name: 'Houston', ... }
 *   'texas'            -> { level: 'state', name: 'Texas', ... }
 *   'united-states'    -> { level: 'country', name: 'United States', ... }
 *   'unknown-slug'     -> null (triggers 404)
 */
export async function resolveGeoSlug(slug: string): Promise<GeoResult | null> {
  // 1. Try cities first (most common lookup — optimize for this)
  const { data: city } = await supabase
    .from('cities')
    .select('id, name, slug')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (city) {
    return { level: 'city', slug: city.slug, name: city.name, id: city.id }
  }

  // 2. Try states/regions
  const { data: state } = await supabase
    .from('states_regions')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (state) {
    return { level: 'state', slug: state.slug, name: state.name, id: state.id }
  }

  // 3. Try countries
  const { data: country } = await supabase
    .from('countries')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (country) {
    return { level: 'country', slug: country.slug, name: country.name, id: country.id }
  }

  // No match at any level → 404
  return null
}
