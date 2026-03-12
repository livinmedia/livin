/**
 * P0-035 — Content Rendering Layer Types
 * Mirrors content_records columns used by the rendering layer.
 * Source of truth: Supabase public.content_records table.
 */

// ─── body_json structure ─────────────────────────────────────────────────────
// Per Doc09 Section 7.2:
// { h1, sections: [{ h2, paragraphs: [string], internal_links: [{ anchor, href }] }], conclusion }

export interface InternalLink {
  anchor: string
  href: string
}

export interface ContentSection {
  h2: string
  paragraphs: string[]
  internal_links?: InternalLink[]
}

export interface BodyJson {
  h1: string
  sections: ContentSection[]
  conclusion: string
}

// ─── Full published content record (reading subset) ──────────────────────────

export interface PublishedContentRecord {
  id: string
  city_id: string
  brand: 'livin' | 'homes_and_livin'
  brand_tag: 'livin' | 'homes_and_livin' | null
  content_type: string
  title: string
  slug: string
  status: string
  h1: string | null
  og_title: string | null
  og_image_url: string | null
  meta_description: string | null
  schema_json: Record<string, unknown> | null
  link_hooks: Record<string, unknown> | null
  body_json: BodyJson | null
  target_keywords: string[]
  published_at: string | null
  updated_at: string
}

// ─── Supabase query result with city join ────────────────────────────────────

export interface ContentRecordWithCity extends PublishedContentRecord {
  cities: {
    name: string
    slug: string
    states_regions: {
      name: string
      abbreviation: string
    }
  }
}

// ─── generateStaticParams shape ──────────────────────────────────────────────

export interface ContentPageParams {
  geoSlug: string
  contentSlug: string
}
