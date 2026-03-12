/**
 * P0-035 — Content Fetching Library
 * Server-side only. Never import from client components.
 */

import { createClient } from '@supabase/supabase-js'
import type { ContentRecordWithCity, ContentPageParams } from '@/types/content'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

export async function getPublishedArticle(
  geoSlug: string,
  contentSlug: string
): Promise<ContentRecordWithCity | null> {
  const supabase = getServiceClient()

  // First get the city id for the geoSlug
  const { data: cityData, error: cityError } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', geoSlug)
    .single()

  if (cityError || !cityData) return null

  // Then fetch the content record using city_id directly
  const { data, error } = await supabase
    .from('content_records')
    .select(`
      id,
      city_id,
      brand,
      brand_tag,
      content_type,
      title,
      slug,
      status,
      h1,
      og_title,
      og_image_url,
      meta_description,
      schema_json,
      link_hooks,
      body_json,
      target_keywords,
      published_at,
      updated_at,
      cities (
        name,
        slug,
        states_regions (
          name,
          abbreviation
        )
      )
    `)
    .eq('slug', contentSlug)
    .eq('status', 'published')
    .eq('city_id', cityData.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('[getPublishedArticle] Supabase error:', error)
    return null
  }

  return data as unknown as ContentRecordWithCity
}


export async function getAllPublishedSlugs(
  brand: 'livin' | 'homes_and_livin'
): Promise<ContentPageParams[]> {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('content_records')
    .select(`
      slug,
      cities ( slug )
    `)
    .eq('status', 'published')
    .eq('brand', brand)

  if (error) {
    console.error('[getAllPublishedSlugs] Supabase error:', error)
    return []
  }

  return (data ?? [])
    .filter((row) => (row.cities as any)?.slug)
    .map((row) => ({
      geoSlug: (row.cities as any)?.slug as string,
      contentSlug: row.slug,
    }))
}