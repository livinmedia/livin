// ============================================================
// LIVIN Platform — Geo Page (City / State / Country)
// P0-026: Geographic Path Resolution
// Doc 2: Section 4.2 — Path Resolution Strategy
// ============================================================
// Handles any single-segment URL:
//   /houston-texas  → city page
//   /texas          → state page
//   /united-states  → country page
//   /unknown-slug   → 404
//
// ISR:
//   City pages  → revalidate every 3600s (1 hour)
//   State pages → revalidate every 86400s (24 hours)
//   Country pages → revalidate every 86400s (24 hours)
// ============================================================

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Brand } from '@/lib/routing/brand-context'
import { resolveGeoSlug } from '@/lib/routing/geo-resolver'
import { normalizeIncomingSlug } from '@/lib/routing/slug-normalizer'
import { getCrossplatformLink } from '@/lib/routing/cross-platform-links'
import { createClient } from '@supabase/supabase-js'

// ISR — city pages revalidate every hour per Doc 2 Section 4.4
export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Props = {
  params: Promise<{ geoSlug: string }>
}

// ── Metadata generation ────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { geoSlug } = await params
  const headersList = await headers()
  const brand = (headersList.get('x-brand') as Brand) || Brand.LIVIN
  const isHL = brand === Brand.HOMES_AND_LIVIN

  const { normalizedSlug } = normalizeIncomingSlug(geoSlug)
  const geo = await resolveGeoSlug(normalizedSlug)

  if (!geo) return { title: 'Not Found' }

  if (geo.level === 'city') {
    return {
      title: isHL
        ? `Homes for Sale in ${geo.name}`
        : `Living in ${geo.name}`,
      description: isHL
        ? `Explore real estate, Market Mayor profiles, and property listings in ${geo.name}.`
        : `Discover food, culture, neighborhoods, events and lifestyle in ${geo.name}.`,
      alternates: {
        canonical: `https://${isHL ? 'homesandlivin.in' : 'livin.in'}/${geo.slug}`,
      },
    }
  }

  if (geo.level === 'state') {
    return {
      title: isHL ? `${geo.name} Real Estate` : `Living in ${geo.name}`,
      description: isHL
        ? `Browse cities, Market Mayors, and real estate markets across ${geo.name}.`
        : `Explore the best cities and lifestyle in ${geo.name}.`,
    }
  }

  return {
    title: isHL ? `${geo.name} Real Estate Markets` : `Cities in ${geo.name}`,
    description: `Explore cities and lifestyle across ${geo.name}.`,
  }
}

// ── Page component ─────────────────────────────────────────────────────────────
export default async function GeoPage({ params }: Props) {
  const { geoSlug } = await params
  const headersList = await headers()
  const brand = (headersList.get('x-brand') as Brand) || Brand.LIVIN
  const isHL = brand === Brand.HOMES_AND_LIVIN

  // Normalize the incoming slug before lookup — Doc 2 Section 4.2.3
  const { normalizedSlug } = normalizeIncomingSlug(geoSlug)

  // Resolve slug to geo level — Doc 2 Section 4.2.2
  const geo = await resolveGeoSlug(normalizedSlug)

  // No match at any level → branded 404
  if (!geo) notFound()

  const accentColor = isHL ? '#1B3A6B' : '#0D7A6B'

  // ── CITY PAGE ──────────────────────────────────────────────────────────────
  if (geo.level === 'city') {
    // Fetch published articles for this city — filtered by brand
    const { data: articles } = await supabase
      .from('content_records')
      .select('id, title, slug, excerpt, category, published_at, word_count')
      .eq('city_id', geo.id)
      .eq('brand', isHL ? 'homes_and_livin' : 'livin')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(10)

    // One-directional cross-platform link — LIVIN → H+L only
    // Doc 2 Section 5 — H+L never links back to LIVIN
    const crossLink = await getCrossplatformLink(brand, geo.slug)

    return (
      <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1100px', margin: '0 auto', padding: '48px 24px' }}>

        {/* City header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>
            {isHL ? 'Real Estate Market' : 'City Guide'}
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: accentColor, marginBottom: '16px' }}>
            {isHL ? `Homes & Real Estate in ${geo.name}` : `Living in ${geo.name}`}
          </h1>
          <p style={{ fontSize: '16px', color: '#555', maxWidth: '640px', lineHeight: 1.6 }}>
            {isHL
              ? `Explore property listings, connect with the local Market Mayor, and discover neighborhoods in ${geo.name}.`
              : `Your complete guide to food, culture, neighborhoods, events, and lifestyle in ${geo.name}.`}
          </p>
        </div>

        {/* Cross-platform link — LIVIN pages only, per Doc 2 Section 5 */}
        {crossLink && (
          <div style={{
            marginBottom: '32px',
            padding: '16px 20px',
            background: '#EAF4F4',
            borderRadius: '8px',
            borderLeft: '4px solid #0D7A6B',
          }}>
            <span style={{ fontSize: '14px', color: '#555' }}>Looking for real estate? </span>
            <a
              href={crossLink.url}
              style={{ color: '#0D7A6B', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}
            >
              {crossLink.text} →
            </a>
          </div>
        )}

        {/* Articles */}
        {articles && articles.length > 0 ? (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#333', marginBottom: '24px' }}>
              {isHL ? 'Local Real Estate Content' : 'City Guides & Articles'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {articles.map((article) => (
                <a
                  key={article.id}
                  href={`/${geo.slug}/${article.slug}`}
                  style={{
                    display: 'block',
                    padding: '20px 24px',
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: 'inherit',
                    borderLeft: `4px solid ${accentColor}`,
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {article.category?.replace(/-/g, ' ')}
                    {article.word_count && ` · ${article.word_count} words`}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: accentColor, marginBottom: '8px' }}>
                    {article.title}
                  </div>
                  {article.excerpt && (
                    <div style={{ fontSize: '14px', color: '#555', lineHeight: 1.5 }}>
                      {article.excerpt}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: '48px', textAlign: 'center', background: '#F9FAFB', borderRadius: '8px', color: '#888' }}>
            <p style={{ marginBottom: '8px', fontWeight: 600 }}>Content coming soon for {geo.name}</p>
            <p style={{ fontSize: '13px' }}>Our AI content pipeline is warming up for this city.</p>
          </div>
        )}
      </div>
    )
  }

  // ── STATE PAGE ─────────────────────────────────────────────────────────────
  if (geo.level === 'state') {
    // Fetch active cities in this state
    const { data: cities } = await supabase
      .from('cities')
      .select('name, slug, is_pilot, has_market_mayor')
      .eq('state_region_id', geo.id)
      .eq('is_active', true)
      .order('launch_priority', { ascending: true })
      .limit(50)

    return (
      <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1100px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>
            {isHL ? 'State Real Estate Market' : 'State Guide'}
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: accentColor, marginBottom: '16px' }}>
            {isHL ? `${geo.name} Real Estate` : `Living in ${geo.name}`}
          </h1>
          <p style={{ fontSize: '16px', color: '#555', lineHeight: 1.6 }}>
            {isHL
              ? `Browse cities, Market Mayors, and real estate markets across ${geo.name}.`
              : `Explore the best cities and lifestyle destinations across ${geo.name}.`}
          </p>
        </div>

        {cities && cities.length > 0 && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#333', marginBottom: '24px' }}>
              Cities in {geo.name}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {cities.map((city) => (
                <a
                  key={city.slug}
                  href={`/${city.slug}`}
                  style={{
                    display: 'block',
                    padding: '16px',
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    borderLeft: `4px solid ${accentColor}`,
                  }}
                >
                  <div style={{ fontWeight: 700, color: accentColor, marginBottom: '4px' }}>{city.name}</div>
                  {city.has_market_mayor && (
                    <div style={{ fontSize: '11px', color: '#0D7A6B', fontWeight: 600 }}>✓ Market Mayor Active</div>
                  )}
                  {city.is_pilot && (
                    <div style={{ fontSize: '11px', color: '#E07A2F', fontWeight: 600 }}>★ Pilot City</div>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── COUNTRY PAGE ───────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1100px', margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: '40px' }}>
        <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>
          {isHL ? 'National Real Estate' : 'National Guide'}
        </div>
        <h1 style={{ fontSize: '42px', fontWeight: 800, color: accentColor, marginBottom: '16px' }}>
          {isHL ? `${geo.name} Real Estate Markets` : `Cities of ${geo.name}`}
        </h1>
        <p style={{ fontSize: '16px', color: '#555', lineHeight: 1.6 }}>
          {isHL
            ? `Explore real estate markets, Market Mayors, and property data across ${geo.name}.`
            : `Discover the best cities and lifestyle destinations across ${geo.name}.`}
        </p>
      </div>
    </div>
  )
}
