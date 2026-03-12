// ============================================================
// LIVIN Platform — ISR Strategy Reference
// P0-027 — Configure ISR Strategy
// Doc 2, Section 4.4
// ============================================================
// This file documents the ISR rules applied across all routes.
// Import ISR_CONFIG where needed for consistent revalidation values.
// ============================================================

// ── Revalidation intervals ────────────────────────────────────────────────

export const ISR_CONFIG = {

  // Top 100 U.S. cities: SSG at build time via generateStaticParams
  // These pages load instantly — no server hit on first request
  TOP_100_CITIES: 'static' as const,

  // All other city/state/country pages: 1 hour
  // Generated on first request, then cached
  GEO_PAGES: 3600,

  // Article and content pages: 15 minutes
  // Higher freshness — content updates propagate quickly
  CONTENT_PAGES: 900,

  // Homepage: 1 hour
  HOMEPAGE: 3600,

  // API routes: always dynamic — never cache API responses
  // create.*, api.*, app.* subdomains: always dynamic
  API_ROUTES: 'force-dynamic' as const,

} as const

// ── Applied in these files ────────────────────────────────────────────────
//
// src/app/page.tsx
//   export const revalidate = ISR_CONFIG.HOMEPAGE  (3600)
//
// src/app/[geoSlug]/page.tsx
//   export const revalidate = ISR_CONFIG.GEO_PAGES  (3600)
//   export async function generateStaticParams() { ...top 100 cities... }
//
// src/app/[geoSlug]/[contentSlug]/page.tsx
//   export const revalidate = ISR_CONFIG.CONTENT_PAGES  (900)
//
// src/app/api/cities/route.ts
//   export const dynamic = ISR_CONFIG.API_ROUTES  ('force-dynamic')
//
// src/app/api/content/route.ts
//   export const dynamic = ISR_CONFIG.API_ROUTES  ('force-dynamic')
//
// src/app/api/revalidate/route.ts
//   export const dynamic = ISR_CONFIG.API_ROUTES  ('force-dynamic')
//
// ── Why these values ──────────────────────────────────────────────────────
//
// SSG for top 100: These are the highest-traffic pages. Pre-building them
// means zero cold-start latency and instant global CDN delivery on Vercel.
//
// 1hr for other geo pages: City data (events, businesses) changes daily
// but not by the minute. 1hr gives freshness without hammering Supabase.
//
// 15min for content: Articles may be approved and published at any time
// by Market Mayors. 15min ensures published content goes live quickly.
//
// force-dynamic for API routes: API responses must never be stale-cached.
// Lead routing, revalidation webhooks, and city data APIs need live data.
