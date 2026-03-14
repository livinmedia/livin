import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Props = { params: Promise<{ geoSlug: string; listingId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { listingId } = await params
  const { data: listing } = await supabase
    .from('property_listings')
    .select('address, neighborhood, price, bedrooms, bathrooms, sqft, city_name, state_abbr')
    .eq('id', listingId)
    .single()
  if (!listing) return { title: 'Listing Not Found' }
  return {
    title: `${listing.address} — $${listing.price.toLocaleString()} | LIVIN`,
    description: `${listing.bedrooms} bed, ${listing.bathrooms} bath, ${listing.sqft?.toLocaleString() || ''} sqft in ${listing.neighborhood || listing.city_name}. View details and contact the listing agent.`,
  }
}

export default async function ListingPage({ params }: Props) {
  const { geoSlug, listingId } = await params

  const { data: listing } = await supabase
    .from('property_listings')
    .select('*')
    .eq('id', listingId)
    .eq('listing_status', 'active')
    .single()

  if (!listing) notFound()

  // Get city info
  const { data: city } = await supabase.from('cities').select('id, name, slug, state_region_id').eq('id', listing.city_id).single()
  let stateAbbr = listing.state_abbr || ''
  if (!stateAbbr && city?.state_region_id) {
    const { data: state } = await supabase.from('states_regions').select('abbreviation').eq('id', city.state_region_id).single()
    stateAbbr = state?.abbreviation?.toUpperCase() || ''
  }

  // Get MM for this city
  let mmProfile: { full_name: string } | null = null
  const { data: mm } = await supabase.from('market_mayors').select('user_id').eq('city_id', listing.city_id).limit(1).single()
  if (mm?.user_id) {
    const { data: prof } = await supabase.from('user_profiles').select('full_name').eq('id', mm.user_id).single()
    mmProfile = prof
  }

  // Related listings in same city
  const { data: related } = await supabase
    .from('property_listings')
    .select('id, address, neighborhood, price, bedrooms, bathrooms, sqft, hero_image_url, badge')
    .eq('city_id', listing.city_id)
    .eq('listing_status', 'active')
    .neq('id', listing.id)
    .order('is_featured', { ascending: false })
    .limit(3)

  const GRAD = 'linear-gradient(135deg, #FFECD2, #FCB69F)'
  const heroImg = listing.hero_image_url ? `url(${listing.hero_image_url}) center/cover` : GRAD

  return (
    <>
      <Nav />

      {/* Breadcrumb */}
      <div className="lv-container" style={{ padding: '16px clamp(24px, 4vw, 80px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--lv-text-muted)' }}>
          <a href="/" style={{ color: 'var(--lv-text-muted)' }}>LIVIN</a>
          <span style={{ color: 'var(--lv-text-light)' }}>/</span>
          <a href={`/${geoSlug}`} style={{ color: 'var(--lv-text-muted)' }}>{city?.name || ''}{stateAbbr ? `, ${stateAbbr}` : ''}</a>
          <span style={{ color: 'var(--lv-text-light)' }}>/</span>
          <span style={{ color: 'var(--lv-black)', fontWeight: 500 }}>Listing</span>
        </div>
      </div>

      {/* Hero image */}
      <div className="lv-container">
        <div style={{
          height: 'clamp(250px, 35vw, 420px)',
          background: heroImg,
          borderRadius: '16px',
          position: 'relative', overflow: 'hidden',
        }}>
          {listing.badge && (
            <span style={{
              position: 'absolute', top: '16px', right: '16px',
              padding: '5px 16px',
              background: listing.badge === 'price_drop' ? '#2D7DD2' : 'var(--lv-orange)',
              borderRadius: 'var(--radius-pill)', fontSize: '11px',
              fontWeight: 700, color: '#fff', letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              {listing.badge === 'price_drop' ? 'Price drop' : listing.badge}
            </span>
          )}
          <div style={{
            position: 'absolute', bottom: '20px', left: '20px',
            padding: '8px 20px', background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)', borderRadius: 'var(--radius-pill)',
          }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>
              ${listing.price.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main content + sidebar */}
      <div className="lv-container" style={{
        display: 'grid', gridTemplateColumns: '1fr 360px',
        gap: '32px', padding: '28px clamp(24px, 4vw, 80px) clamp(48px, 6vw, 80px)',
        alignItems: 'flex-start',
      }}>
        {/* Left — listing details */}
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 3vw, 36px)',
            color: 'var(--lv-black)', lineHeight: 1.1,
            marginBottom: '8px',
          }}>
            {listing.address}
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--lv-text-muted)', marginBottom: '20px' }}>
            {listing.neighborhood || city?.name}{stateAbbr ? `, ${stateAbbr}` : ''} {listing.zip_code || ''}
          </p>

          {/* Specs bar */}
          <div style={{
            display: 'flex', gap: '24px', padding: '16px 20px',
            background: 'var(--lv-cream)', borderRadius: '12px',
            marginBottom: '24px', flexWrap: 'wrap',
          }}>
            {listing.bedrooms && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--lv-black)' }}>{listing.bedrooms}</div>
                <div style={{ fontSize: '12px', color: 'var(--lv-text-muted)' }}>Bedrooms</div>
              </div>
            )}
            {listing.bathrooms && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--lv-black)' }}>{listing.bathrooms}</div>
                <div style={{ fontSize: '12px', color: 'var(--lv-text-muted)' }}>Bathrooms</div>
              </div>
            )}
            {listing.sqft && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--lv-black)' }}>{listing.sqft.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: 'var(--lv-text-muted)' }}>Sqft</div>
              </div>
            )}
            {listing.year_built && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--lv-black)' }}>{listing.year_built}</div>
                <div style={{ fontSize: '12px', color: 'var(--lv-text-muted)' }}>Built</div>
              </div>
            )}
            {listing.lot_size && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--lv-black)' }}>{listing.lot_size}</div>
                <div style={{ fontSize: '12px', color: 'var(--lv-text-muted)' }}>Lot</div>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--lv-black)' }}>{listing.property_type.replace(/_/g, ' ')}</div>
              <div style={{ fontSize: '12px', color: 'var(--lv-text-muted)' }}>Type</div>
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--lv-black)', marginBottom: '10px' }}>About this home</h3>
              <p style={{ fontSize: '15px', fontWeight: 300, color: 'var(--lv-text-muted)', lineHeight: 1.7 }}>
                {listing.description}
              </p>
            </div>
          )}

          {/* Listing details */}
          <div style={{
            padding: '20px', background: '#fff', border: '1px solid var(--lv-border)',
            borderRadius: '14px', marginBottom: '28px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lv-black)', marginBottom: '12px' }}>Listing details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
              {listing.mls_number && <div><span style={{ color: 'var(--lv-text-muted)' }}>MLS #</span> <span style={{ fontWeight: 500 }}>{listing.mls_number}</span></div>}
              <div><span style={{ color: 'var(--lv-text-muted)' }}>Status</span> <span style={{ fontWeight: 500, color: 'var(--lv-green)' }}>{listing.listing_status}</span></div>
              {listing.days_on_market !== null && <div><span style={{ color: 'var(--lv-text-muted)' }}>Days on market</span> <span style={{ fontWeight: 500 }}>{listing.days_on_market}</span></div>}
              <div><span style={{ color: 'var(--lv-text-muted)' }}>Price/sqft</span> <span style={{ fontWeight: 500 }}>${listing.sqft ? Math.round(listing.price / listing.sqft) : '—'}</span></div>
              {listing.listing_agent_name && <div><span style={{ color: 'var(--lv-text-muted)' }}>Listed by</span> <span style={{ fontWeight: 500 }}>{listing.listing_agent_name}</span></div>}
              <div><span style={{ color: 'var(--lv-text-muted)' }}>Source</span> <span style={{ fontWeight: 500 }}>{listing.source.replace(/_/g, ' ')}</span></div>
            </div>
          </div>

          {/* Related listings */}
          {related && related.length > 0 && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--lv-black)', marginBottom: '14px' }}>
                More homes in {city?.name || ''}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {related.map((r: any, i: number) => (
                  <a key={r.id} href={`/${geoSlug}/listing/${r.id}`} style={{
                    background: '#fff', borderRadius: '14px', overflow: 'hidden',
                    border: '1px solid var(--lv-border)', textDecoration: 'none', color: 'inherit',
                  }}>
                    <div style={{
                      height: '100px',
                      background: r.hero_image_url ? `url(${r.hero_image_url}) center/cover` : GRAD,
                      position: 'relative',
                    }}>
                      <span style={{
                        position: 'absolute', bottom: '8px', left: '10px',
                        padding: '3px 10px', background: 'rgba(0,0,0,0.6)',
                        borderRadius: 'var(--radius-pill)', fontSize: '12px', fontWeight: 600, color: '#fff',
                      }}>${r.price.toLocaleString()}</span>
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--lv-black)' }}>{r.address}</div>
                      <div style={{ fontSize: '11px', color: 'var(--lv-text-muted)' }}>
                        {r.bedrooms} bed · {r.bathrooms} bath · {r.sqft?.toLocaleString()} sqft
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar — agent contact + lead form */}
        <aside style={{ position: 'sticky', top: '80px' }}>
          {/* Agent card */}
          <div style={{
            background: '#fff', border: '1px solid var(--lv-border)',
            borderRadius: '14px', padding: '24px', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lv-orange)', marginBottom: '12px' }}>
              Listing agent
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF9A5C, #E85D2A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', color: '#fff', fontFamily: 'var(--font-display)',
              }}>
                {(listing.listing_agent_name || 'A').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--lv-black)' }}>
                  {listing.listing_agent_name || 'Contact Agent'}
                </div>
                {mmProfile && (
                  <div style={{ fontSize: '12px', color: 'var(--lv-orange)' }}>Market Mayor · {city?.name}</div>
                )}
              </div>
            </div>
            {listing.listing_agent_phone && (
              <div style={{ fontSize: '13px', color: 'var(--lv-text-muted)', marginBottom: '4px' }}>{listing.listing_agent_phone}</div>
            )}
            {listing.listing_agent_email && (
              <div style={{ fontSize: '13px', color: 'var(--lv-text-muted)', marginBottom: '14px' }}>{listing.listing_agent_email}</div>
            )}
            <a href="#" style={{
              display: 'block', textAlign: 'center', padding: '14px',
              background: 'var(--lv-orange-grad)', color: '#fff',
              borderRadius: 'var(--radius-pill)', fontSize: '15px', fontWeight: 600,
              boxShadow: '0 4px 16px rgba(232,93,42,0.2)',
            }}>
              Contact agent →
            </a>
          </div>

          {/* Lead capture form */}
          <div style={{
            background: 'var(--lv-cream)', borderRadius: '14px',
            padding: '24px', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--lv-black)', marginBottom: '4px' }}>
              Interested in this home?
            </div>
            <div style={{ fontSize: '13px', color: 'var(--lv-text-muted)', marginBottom: '16px' }}>
              Get more details and schedule a showing.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" placeholder="Your name" style={{
                padding: '12px 16px', background: '#fff', border: '1px solid var(--lv-border)',
                borderRadius: '10px', fontSize: '14px', color: 'var(--lv-black)', outline: 'none',
              }} />
              <input type="email" placeholder="Email" style={{
                padding: '12px 16px', background: '#fff', border: '1px solid var(--lv-border)',
                borderRadius: '10px', fontSize: '14px', color: 'var(--lv-black)', outline: 'none',
              }} />
              <input type="tel" placeholder="Phone (optional)" style={{
                padding: '12px 16px', background: '#fff', border: '1px solid var(--lv-border)',
                borderRadius: '10px', fontSize: '14px', color: 'var(--lv-black)', outline: 'none',
              }} />
              <button style={{
                padding: '14px', background: 'var(--lv-black)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-pill)',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}>
                Request info
              </button>
            </div>
          </div>

          {/* Back to city */}
          <a href={`/${geoSlug}`} style={{
            display: 'block', textAlign: 'center', padding: '10px',
            fontSize: '13px', color: 'var(--lv-text-muted)',
          }}>
            ← Back to {city?.name || 'city page'}
          </a>
        </aside>
      </div>

      <Footer />
    </>
  )
}
