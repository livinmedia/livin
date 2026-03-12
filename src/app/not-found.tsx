// ============================================================
// LIVIN Platform — Branded 404 Page
// P0-030: Create Branded 404 Pages
// Doc 2: Section 8.1 — 404 Handling
// ============================================================
// LIVIN 404: lifestyle-branded, suggests popular cities
// H+L 404:   real-estate-branded, suggests property search
// Neither brand references the other — complete separation
// ============================================================

import { headers } from 'next/headers'
import { Brand } from '@/lib/routing/brand-context'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function NotFound() {
  const headersList = await headers()
  const brand = (headersList.get('x-brand') as Brand) || Brand.LIVIN
  const isHL = brand === Brand.HOMES_AND_LIVIN

  // Fetch a few active cities to suggest
  const { data: cities } = await supabase
    .from('cities')
    .select('name, slug')
    .eq('is_active', true)
    .order('launch_priority', { ascending: true })
    .limit(4)

  const accentColor = isHL ? '#1B3A6B' : '#0D7A6B'

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '640px',
      margin: '80px auto',
      padding: '0 24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '72px', fontWeight: 800, color: '#E5E7EB', marginBottom: '8px' }}>
        404
      </div>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: accentColor, marginBottom: '16px' }}>
        {isHL ? 'This market page was not found' : 'This city guide was not found'}
      </h1>
      <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.6, marginBottom: '40px' }}>
        {isHL
          ? 'The real estate page you are looking for does not exist, or may have moved. Try searching for a city below.'
          : 'The lifestyle guide you are looking for does not exist, or may have moved. Explore our featured cities below.'}
      </p>

      {/* Suggested cities */}
      {cities && cities.length > 0 && (
        <div>
          <p style={{ fontSize: '14px', color: '#888', marginBottom: '16px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isHL ? 'Featured Markets' : 'Featured Cities'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {cities.map((city) => (
              <a
                key={city.slug}
                href={`/${city.slug}`}
                style={{
                  padding: '10px 20px',
                  background: '#fff',
                  border: `2px solid ${accentColor}`,
                  borderRadius: '8px',
                  color: accentColor,
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '15px',
                }}
              >
                {city.name}
              </a>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '40px' }}>
        <a
          href="/"
          style={{ color: accentColor, fontWeight: 600, textDecoration: 'none', fontSize: '15px' }}
        >
          ← Back to homepage
        </a>
      </div>
    </div>
  )
}
