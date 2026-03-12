// ============================================================
// LIVIN Platform — Cross-Platform Link Utility
// Doc 2: Section 5 — Cross-Platform SEO Linking Rules
// P0-031
// ============================================================
// THE ONLY APPROVED METHOD for generating LIVIN → H+L links.
//
// ONE-DIRECTIONAL RULE — HARD ENFORCED:
//   LIVIN → Homes & Livin: ALLOWED (real estate intent only)
//   Homes & Livin → LIVIN: NEVER
//   LPT links from either platform: NEVER
//
// HARDCODED cross-domain links are PROHIBITED anywhere in the codebase.
// All cross-platform links must go through this utility.
// ============================================================

import { Brand, LIVIN_DOMAIN, HL_DOMAIN } from './brand-context'
import { createClient } from '@supabase/supabase-js'

// ── Supabase client (read-only, anon key) ─────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Real estate intent signals (Doc 2, Section 5.2) ──────────────────────
const REAL_ESTATE_INTENT_SIGNALS = [
  'buy a home', 'buying a home', 'homes for sale', 'real estate',
  'market report', 'property listings', 'mortgage', 'moving to',
  'relocating to', 'relocation', 'neighborhood market', 'home prices',
  'housing market', 'market mayor', 'find an agent', 'real estate agent',
] as const

// ── Types ─────────────────────────────────────────────────────────────────

export type CrossPlatformLink = {
  text: string
  url: string
  rel: string        // Always 'noopener noreferrer'
  target: string     // Always '_blank' for cross-domain links
  citySlug: string
}

export type LinkClickEvent = {
  from_brand: Brand
  from_url: string
  to_url: string
  city_slug: string
  timestamp: string
}

// ── URL generators ────────────────────────────────────────────────────────

/**
 * generateHLCityUrl('houston-texas') → 'https://homesandlivin.in/houston-texas'
 */
export function generateHLCityUrl(citySlug: string): string {
  return `https://${HL_DOMAIN}/${citySlug}`
}

/**
 * generateLivinCityUrl('houston-texas') → 'https://livin.in/houston-texas'
 */
export function generateLivinCityUrl(citySlug: string): string {
  return `https://${LIVIN_DOMAIN}/${citySlug}`
}

/**
 * generateContentUrl(Brand.LIVIN, 'houston-texas', 'best-restaurants-2026')
 *   → 'https://livin.in/houston-texas/best-restaurants-2026'
 */
export function generateContentUrl(
  brand: Brand,
  citySlug: string,
  contentSlug: string
): string {
  const domain = brand === Brand.LIVIN ? LIVIN_DOMAIN : HL_DOMAIN
  return `https://${domain}/${citySlug}/${contentSlug}`
}

// ── City validation ───────────────────────────────────────────────────────

/**
 * Validates that a city slug exists and is active in Supabase.
 * Prevents dead cross-platform links to cities not yet onboarded on H+L.
 */
export async function cityExistsInSupabase(citySlug: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.warn(`[cross-platform-links] Supabase city check failed for "${citySlug}":`, error.message)
      return false
    }

    return data !== null
  } catch (err) {
    console.warn(`[cross-platform-links] Unexpected error checking city "${citySlug}":`, err)
    return false
  }
}

// ── Intent detection ──────────────────────────────────────────────────────

/**
 * Checks if text contains real estate intent signals.
 * Used by AI agents to determine if a LIVIN article should link to H+L.
 */
export function hasRealEstateIntent(text: string): boolean {
  const lower = text.toLowerCase()
  return REAL_ESTATE_INTENT_SIGNALS.some(signal => lower.includes(signal))
}

// ── Click logging ─────────────────────────────────────────────────────────

/**
 * Logs a cross-platform link click to Supabase agent_run_log.
 * Non-blocking — fires and forgets, never interrupts navigation.
 */
export async function logCrossPlatformClick(event: LinkClickEvent): Promise<void> {
  try {
    await supabase.from('agent_run_log').insert({
      agent_id:   null,
      event_type: 'cross_platform_link_click',
      payload: {
        from_brand: event.from_brand,
        from_url:   event.from_url,
        to_url:     event.to_url,
        city_slug:  event.city_slug,
      },
      created_at: event.timestamp,
    })
  } catch (err) {
    // Never throw — logging must never break navigation
    console.warn('[cross-platform-links] Click log failed (non-critical):', err)
  }
}

// ── Primary export ────────────────────────────────────────────────────────

/**
 * THE ONLY APPROVED WAY to generate a LIVIN → H+L cross-platform link.
 *
 * - Validates city exists in Supabase before returning a link
 * - Enforces one-directional rule (H+L → LIVIN always returns null)
 * - Always includes rel="noopener noreferrer" and target="_blank"
 * - Returns null if: wrong direction, city not found, or any error
 *
 * Usage:
 *   const link = await getCrossplatformLink(Brand.LIVIN, 'houston-texas')
 *   if (link) {
 *     return (
 *       <a href={link.url} rel={link.rel} target={link.target}
 *          onClick={() => logCrossPlatformClick({ ... })}>
 *         {link.text}
 *       </a>
 *     )
 *   }
 */
export async function getCrossplatformLink(
  currentBrand: Brand,
  citySlug: string
): Promise<CrossPlatformLink | null> {

  // HARD RULE 1: H+L never links back to LIVIN
  if (currentBrand === Brand.HOMES_AND_LIVIN) {
    return null
  }

  // HARD RULE 2: Validate city exists in Supabase before generating link
  const cityExists = await cityExistsInSupabase(citySlug)
  if (!cityExists) {
    console.warn(`[cross-platform-links] City "${citySlug}" not found or inactive — link suppressed`)
    return null
  }

  // Format display text: 'houston-texas' → 'Houston'
  const cityName = citySlug
    .split('-')
    .slice(0, -1)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return {
    text:     `Explore ${cityName} real estate on Homes & Livin`,
    url:      generateHLCityUrl(citySlug),
    rel:      'noopener noreferrer',
    target:   '_blank',
    citySlug,
  }
}

// ── Sync version (no Supabase check) ─────────────────────────────────────
// Use ONLY when city existence has already been confirmed upstream
// (e.g. static generation, AI agent server-side). Prefer getCrossplatformLink()
// for all client-side usage.

export function getCrossplatformLinkSync(
  currentBrand: Brand,
  citySlug: string
): CrossPlatformLink | null {
  if (currentBrand === Brand.HOMES_AND_LIVIN) {
    return null
  }

  const cityName = citySlug
    .split('-')
    .slice(0, -1)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return {
    text:     `Explore ${cityName} real estate on Homes & Livin`,
    url:      generateHLCityUrl(citySlug),
    rel:      'noopener noreferrer',
    target:   '_blank',
    citySlug,
  }
}
