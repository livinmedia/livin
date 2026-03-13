// ============================================================
// LIVIN Platform — Homepage
// ============================================================

import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function HomePage() {
  const { data: cities } = await supabase
    .from('cities')
    .select('name, slug, is_pilot')
    .eq('is_active', true)
    .order('launch_priority', { ascending: true })
    .limit(20)

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1100px', margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#0D7A6B', marginBottom: '16px' }}>
          LIVIN
        </h1>
        <p style={{ fontSize: '18px', color: '#555', maxWidth: '640px', lineHeight: 1.6 }}>
          Discover the best of city living — food, culture, neighborhoods, and lifestyle.
        </p>
      </div>

      {cities && cities.length > 0 && (
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#333', marginBottom: '24px' }}>
            Explore Cities
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
                  borderLeft: '4px solid #0D7A6B',
                }}
              >
                <div style={{ fontWeight: 700, color: '#0D7A6B' }}>{city.name}</div>
                {city.is_pilot && (
                  <div style={{ fontSize: '11px', color: '#E07A2F', fontWeight: 600, marginTop: '4px' }}>★ Pilot City</div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
