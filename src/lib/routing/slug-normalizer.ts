// ============================================================
// LIVIN Platform — Slug Normalizer
// Doc 2: Section 7.1 — Normalization Rules
// ============================================================
// Single shared utility used by ALL systems that create or
// resolve URLs. Never duplicate this logic elsewhere.
// ============================================================

// State abbreviation lookup table — Doc 2, Section 7.3
// Maps two-letter abbreviations to full lowercase state names
// Used for 301 redirects: /houston-tx -> /houston-texas
export const STATE_ABBREVIATIONS: Record<string, string> = {
  al: 'alabama', ak: 'alaska', az: 'arizona', ar: 'arkansas',
  ca: 'california', co: 'colorado', ct: 'connecticut', de: 'delaware',
  fl: 'florida', ga: 'georgia', hi: 'hawaii', id: 'idaho',
  il: 'illinois', in: 'indiana', ia: 'iowa', ks: 'kansas',
  ky: 'kentucky', la: 'louisiana', me: 'maine', md: 'maryland',
  ma: 'massachusetts', mi: 'michigan', mn: 'minnesota', ms: 'mississippi',
  mo: 'missouri', mt: 'montana', ne: 'nebraska', nv: 'nevada',
  nh: 'new-hampshire', nj: 'new-jersey', nm: 'new-mexico', ny: 'new-york',
  nc: 'north-carolina', nd: 'north-dakota', oh: 'ohio', ok: 'oklahoma',
  or: 'oregon', pa: 'pennsylvania', ri: 'rhode-island', sc: 'south-carolina',
  sd: 'south-dakota', tn: 'tennessee', tx: 'texas', ut: 'utah',
  vt: 'vermont', va: 'virginia', wa: 'washington', wv: 'west-virginia',
  wi: 'wisconsin', wy: 'wyoming', dc: 'district-of-columbia',
}

/**
 * Normalizes a single string segment to a URL-safe slug.
 * Doc 2, Section 7.1 rules applied in order.
 *
 * Examples:
 *   'Houston'     -> 'houston'
 *   'San José'    -> 'san-jose'
 *   'St. Louis'   -> 'st-louis'
 *   "O'Fallon"    -> 'ofallon'
 *   'New  York'   -> 'new-york'
 */
export function normalizeSegment(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')                          // Decompose accented chars
    .replace(/[\u0300-\u036f]/g, '')           // Strip accent marks
    .replace(/['']/g, '')                      // Remove apostrophes
    .replace(/[.,]/g, '')                      // Remove commas and periods
    .replace(/[^a-z0-9\s-]/g, '')             // Remove remaining special chars
    .trim()
    .replace(/[\s_]+/g, '-')                   // Spaces/underscores → hyphens
    .replace(/-{2,}/g, '-')                    // Collapse double hyphens
    .replace(/^-+|-+$/g, '')                   // Strip leading/trailing hyphens
    .slice(0, 100)                             // Max 100 chars, truncate at boundary
}

/**
 * Generates the canonical city slug.
 * Doc 2, Section 7.2 — the single shared slug generation function.
 *
 * generateCitySlug('Houston', 'Texas')           -> 'houston-texas'
 * generateCitySlug('San Francisco', 'California') -> 'san-francisco-california'
 * generateCitySlug('New York', 'New York')        -> 'new-york-new-york'
 */
export function generateCitySlug(city: string, state: string): string {
  const citySlug = normalizeSegment(city)
  const stateSlug = normalizeSegment(state)
  return `${citySlug}-${stateSlug}`
}

/**
 * Normalizes an incoming URL slug for database lookup.
 * Handles common user input variations before querying Supabase.
 * Doc 2, Section 4.2.3
 *
 * Also expands state abbreviations:
 *   'houston-tx' -> 'houston-texas' (triggers 301 redirect in middleware)
 */
export function normalizeIncomingSlug(slug: string): {
  normalizedSlug: string
  wasAbbreviated: boolean
} {
  // Guard against undefined slug (Next.js 16 may call with undefined on root route)
  if (!slug || typeof slug !== 'string') {
    return { normalizedSlug: '', wasAbbreviated: false }
  }

  const base = slug
    .toLowerCase()
    .replace(/_/g, '-')          // underscores → hyphens
    .replace(/\/+$/, '')         // strip trailing slashes
    .replace(/-{2,}/g, '-')      // collapse double hyphens
    .replace(/[^a-z0-9-]/g, '')  // strip non-alphanumeric except hyphens

  // Attempt state abbreviation expansion
  // Pattern: [city-parts]-[2-letter-state] e.g. houston-tx, los-angeles-ca
  const parts = base.split('-')
  const lastPart = parts[parts.length - 1]

  if (lastPart && lastPart.length === 2 && STATE_ABBREVIATIONS[lastPart]) {
    const expandedState = STATE_ABBREVIATIONS[lastPart]
    const cityParts = parts.slice(0, -1).join('-')
    return {
      normalizedSlug: `${cityParts}-${expandedState}`,
      wasAbbreviated: true,
    }
  }

  return { normalizedSlug: base, wasAbbreviated: false }
}
