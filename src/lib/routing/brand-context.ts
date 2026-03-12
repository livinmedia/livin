// ============================================================
// LIVIN Platform — Brand Context
// Doc 2: Platform URL Routing & Domain Architecture Spec
// ============================================================
// Defines the two brands and how to detect them from a hostname.
// NEVER add LPT here — it lives on its own separate domain.
// ============================================================

export enum Brand {
  LIVIN = 'LIVIN',
  HOMES_AND_LIVIN = 'HOMES_AND_LIVIN',
}

export type BrandContext = {
  brand: Brand
  domain: string        // e.g. 'livin.in' or 'homesandlivin.in'
  subdomain: string | null  // e.g. 'create', 'api', 'tx', null
}

// Primary domains — .in TLD only. No .com anywhere.
export const LIVIN_DOMAIN = 'livin.in'
export const HL_DOMAIN = 'homesandlivin.in'

// Authorized subdomains per brand
export const LIVIN_SUBDOMAINS = ['create', 'api'] as const
export const HL_SUBDOMAINS = ['create', 'api', 'app'] as const

// Two-letter state pattern for [state].homesandlivin.in email subdomains
const STATE_ABBR_PATTERN = /^[a-z]{2}$/

/**
 * Parses a hostname and returns the brand context.
 * Used by middleware on every incoming request.
 *
 * Examples:
 *   'livin.in'              -> { brand: LIVIN, domain: 'livin.in', subdomain: null }
 *   'create.livin.in'       -> { brand: LIVIN, domain: 'livin.in', subdomain: 'create' }
 *   'homesandlivin.in'      -> { brand: HOMES_AND_LIVIN, domain: 'homesandlivin.in', subdomain: null }
 *   'tx.homesandlivin.in'   -> { brand: HOMES_AND_LIVIN, domain: 'homesandlivin.in', subdomain: 'tx' }
 *   'localhost:3000'         -> { brand: LIVIN, domain: 'localhost', subdomain: null } (dev fallback)
 */
export function parseBrandContext(hostname: string): BrandContext | null {
  // Strip port if present (for local dev)
  const host = hostname.split(':')[0]

  // --- Development fallback ---
  // localhost always resolves to LIVIN brand for local testing
  if (host === 'localhost' || host === '127.0.0.1') {
    return { brand: Brand.LIVIN, domain: host, subdomain: null }
  }

  // --- livin.in ---
  if (host === LIVIN_DOMAIN) {
    return { brand: Brand.LIVIN, domain: LIVIN_DOMAIN, subdomain: null }
  }
  if (host.endsWith(`.${LIVIN_DOMAIN}`)) {
    const subdomain = host.replace(`.${LIVIN_DOMAIN}`, '')
    // Only authorized subdomains allowed
    if ((LIVIN_SUBDOMAINS as readonly string[]).includes(subdomain)) {
      return { brand: Brand.LIVIN, domain: LIVIN_DOMAIN, subdomain }
    }
    return null // Unknown subdomain → 404
  }

  // --- homesandlivin.in ---
  if (host === HL_DOMAIN) {
    return { brand: Brand.HOMES_AND_LIVIN, domain: HL_DOMAIN, subdomain: null }
  }
  if (host.endsWith(`.${HL_DOMAIN}`)) {
    const subdomain = host.replace(`.${HL_DOMAIN}`, '')
    // Authorized named subdomains
    if ((HL_SUBDOMAINS as readonly string[]).includes(subdomain)) {
      return { brand: Brand.HOMES_AND_LIVIN, domain: HL_DOMAIN, subdomain }
    }
    // State-level email subdomains: tx.homesandlivin.in, ca.homesandlivin.in, etc.
    if (STATE_ABBR_PATTERN.test(subdomain)) {
      return { brand: Brand.HOMES_AND_LIVIN, domain: HL_DOMAIN, subdomain }
    }
    return null // Unknown subdomain → 404
  }

  // Unknown domain
  return null
}
