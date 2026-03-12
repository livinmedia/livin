// ============================================================
// LIVIN — Geo Page
// Assembled from shared components matching livin_mock_up.png
// ============================================================

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Brand } from '@/lib/routing/brand-context'
import { resolveGeoSlug } from '@/lib/routing/geo-resolver'
import { normalizeIncomingSlug } from '@/lib/routing/slug-normalizer'
import { getCrossplatformLink } from '@/lib/routing/cross-platform-links'

import CityHero from '@/components/livin/CityHero'
import CityOverview from '@/components/livin/CityOverview'
import NeighborhoodGrid from '@/components/livin/NeighborhoodGrid'
import { EventsColumn, PropertiesColumn } from '@/components/livin/CityColumns'
import MarketMayorSection from '@/components/livin/MarketMayorSection'
import { ArticleList, LivinFooter } from '@/components/livin/CityContent'

export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Full state name → abbreviation lookup
const STATE_ABBR: Record<string, string> = {
  alabama:'AL',alaska:'AK',arizona:'AZ',arkansas:'AR',california:'CA',
  colorado:'CO',connecticut:'CT',delaware:'DE',florida:'FL',georgia:'GA',
  hawaii:'HI',idaho:'ID',illinois:'IL',indiana:'IN',iowa:'IA',kansas:'KS',
  kentucky:'KY',louisiana:'LA',maine:'ME',maryland:'MD',massachusetts:'MA',
  michigan:'MI',minnesota:'MN',mississippi:'MS',missouri:'MO',montana:'MT',
  nebraska:'NE',nevada:'NV','new-hampshire':'NH','new-jersey':'NJ',
  'new-mexico':'NM','new-york':'NY','north-carolina':'NC','north-dakota':'ND',
  ohio:'OH',oklahoma:'OK',oregon:'OR',pennsylvania:'PA','rhode-island':'RI',
  'south-carolina':'SC','south-dakota':'SD',tennessee:'TN',texas:'TX',
  utah:'UT',vermont:'VT',virginia:'VA',washington:'WA','west-virginia':'WV',
  wisconsin:'WI',wyoming:'WY','district-of-columbia':'DC',
}

function extractStateAbbr(citySlug: string): string {
  const parts = citySlug.split('-')
  // Try matching last 2 parts as state (e.g. "new-york")
  if (parts.length >= 2) {
    const lastTwo = parts.slice(-2).join('-')
    if (STATE_ABBR[lastTwo]) return STATE_ABBR[lastTwo]
  }
  const lastOne = parts[parts.length - 1]
  return STATE_ABBR[lastOne] || ''
}

type Props = { params: Promise<{ geoSlug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { geoSlug } = await params
  const { normalizedSlug } = normalizeIncomingSlug(geoSlug ?? '')
  if (!normalizedSlug) return { title: 'Not Found' }
  const geo = await resolveGeoSlug(normalizedSlug)
  if (!geo) return { title: 'Not Found' }
  return {
    title: geo.level === 'city' ? `Living in ${geo.name}` : `Living in ${geo.name}`,
    description: `Discover food, culture, neighborhoods, events and lifestyle in ${geo.name}.`,
    alternates: { canonical: `https://livin.in/${geo.slug}` },
  }
}

export default async function GeoPage({ params }: Props) {
  const { geoSlug } = await params
  const headersList = await headers()
  const brand = (headersList.get('x-brand') as Brand) || Brand.LIVIN
  const isHL = brand === Brand.HOMES_AND_LIVIN

  const { normalizedSlug } = normalizeIncomingSlug(geoSlug ?? '')
  if (!normalizedSlug) notFound()
  const geo = await resolveGeoSlug(normalizedSlug)
  if (!geo) notFound()

  // ── CITY PAGE ─────────────────────────────────────────────
  if (geo.level === 'city') {
    const { data: articles } = await supabase
      .from('content_records')
      .select('id, title, slug, excerpt, category, published_at, word_count')
      .eq('city_id', geo.id)
      .eq('brand', isHL ? 'homes_and_livin' : 'livin')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(8)

    const crossLink = await getCrossplatformLink(brand, geo.slug)
    const stateAbbr = extractStateAbbr(geo.slug)

    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
          *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'DM Sans',sans-serif; color:#1a1a1a; background:#fff; -webkit-font-smoothing:antialiased; }
          a { text-decoration:none; color:inherit; }
          button { font-family:'DM Sans',sans-serif; cursor:pointer; }

          .page-wrap { max-width: 1100px; margin: 0 auto; padding: 0 28px; }

          .sec-hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
          .sec-title { font-family:'DM Sans',sans-serif; font-size:20px; font-weight:700; color:#1a1a1a; }
          .sec-link { font-size:12.5px; font-weight:600; color:#555; }
          .sec-link:hover { color:#1a1a1a; }

          .two-col { display:grid; grid-template-columns:1fr 1fr; gap:36px; margin-bottom:44px; }

          .pt-28 { padding-top: 28px; }
          .mb-44 { margin-bottom: 44px; }

          @media(max-width:700px){ .two-col { grid-template-columns:1fr; } }
        `}</style>

        {/* HERO — full width, no container */}
        <CityHero cityName={geo.name} stateAbbr={stateAbbr} mayorName="Mayor Scott" />

        <div className="page-wrap">

          {/* CITY OVERVIEW */}
          <div className="sec-hdr pt-28">
            <h2 className="sec-title">City Overview</h2>
            <a href="#" className="sec-link">More Community Insights &rsaquo;</a>
          </div>
          <CityOverview />

          {/* NEIGHBORHOOD HIGHLIGHTS */}
          <div className="sec-hdr">
            <h2 className="sec-title">Neighborhood Highlights</h2>
            <a href="#" className="sec-link">View All Neighborhoods &rsaquo;</a>
          </div>
          <NeighborhoodGrid />

          {/* EVENTS + PROPERTIES */}
          <div className="two-col">
            <div>
              <div className="sec-hdr">
                <h2 className="sec-title">Upcoming Events</h2>
              </div>
              <EventsColumn />
            </div>
            <div>
              <div className="sec-hdr">
                <h2 className="sec-title">Featured Properties</h2>
                <a href={crossLink?.url || '#'} className="sec-link">View All Listings &rsaquo;</a>
              </div>
              <PropertiesColumn halLink={crossLink?.url} />
            </div>
          </div>

          {/* TRUSTED LOCAL EXPERTS */}
          <div className="sec-hdr">
            <h2 className="sec-title">Trusted Local Experts</h2>
          </div>
          <MarketMayorSection cityName={geo.name} mayorName="Mayor Scott" />

          {/* ARTICLES */}
          {articles && articles.length > 0 && (
            <>
              <div className="sec-hdr">
                <h2 className="sec-title">Latest from {geo.name}</h2>
                <a href="#" className="sec-link">View All &rsaquo;</a>
              </div>
            </>
          )}
          <ArticleList articles={articles || []} citySlug={geo.slug} cityName={geo.name} />

        </div>

        {/* FOOTER — full width */}
        <LivinFooter />
      </>
    )
  }

  // ── STATE PAGE ────────────────────────────────────────────
  if (geo.level === 'state') {
    const { data: cities } = await supabase
      .from('cities')
      .select('name, slug, is_pilot, has_market_mayor')
      .eq('state_region_id', geo.id)
      .eq('is_active', true)
      .order('launch_priority', { ascending: true })
      .limit(50)

    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
          *{margin:0;padding:0;box-sizing:border-box;} body{font-family:'DM Sans',sans-serif;} a{text-decoration:none;color:inherit;}
        `}</style>
        <nav style={{ background:'#1a2744', padding:'16px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <a href="/" style={{ fontFamily:'Oswald,sans-serif', fontSize:22, fontWeight:700, color:'#fff', letterSpacing:1 }}>LIVIN</a>
          <a href="/" style={{ fontSize:13, color:'rgba(255,255,255,0.65)', fontFamily:'DM Sans,sans-serif' }}>← All Cities</a>
        </nav>
        <div style={{ maxWidth:1100, margin:'40px auto', padding:'0 28px' }}>
          <h1 style={{ fontFamily:'DM Sans,sans-serif', fontSize:36, fontWeight:800, marginBottom:8 }}>Living in {geo.name}</h1>
          <p style={{ color:'#888', marginBottom:32, fontFamily:'DM Sans,sans-serif', fontSize:14 }}>Explore the best cities across {geo.name}</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:12 }}>
            {cities?.map(city => (
              <a key={city.slug} href={`/${city.slug}`}
                style={{ padding:16, background:'#fff', border:'1px solid #ebebeb', borderLeft:'4px solid #1a2744', borderRadius:8 }}>
                <div style={{ fontWeight:700, color:'#1a2744', marginBottom:4, fontFamily:'DM Sans,sans-serif', fontSize:14 }}>{city.name}</div>
                {city.has_market_mayor && <div style={{ fontSize:11, color:'#2a7d4f' }}>✓ Market Mayor Active</div>}
                {city.is_pilot && <div style={{ fontSize:11, color:'#f5a623' }}>★ Pilot City</div>}
              </a>
            ))}
          </div>
        </div>
        <LivinFooter />
      </>
    )
  }

  // ── COUNTRY PAGE ──────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;} body{font-family:'DM Sans',sans-serif;} a{text-decoration:none;color:inherit;}
      `}</style>
      <nav style={{ background:'#1a2744', padding:'16px 28px' }}>
        <a href="/" style={{ fontFamily:'Oswald,sans-serif', fontSize:22, fontWeight:700, color:'#fff', letterSpacing:1 }}>LIVIN</a>
      </nav>
      <div style={{ maxWidth:1100, margin:'40px auto', padding:'0 28px' }}>
        <h1 style={{ fontFamily:'DM Sans,sans-serif', fontSize:36, fontWeight:800, marginBottom:8 }}>Cities of {geo.name}</h1>
        <p style={{ color:'#888', fontFamily:'DM Sans,sans-serif', fontSize:14 }}>Explore lifestyle destinations across {geo.name}</p>
      </div>
      <LivinFooter />
    </>
  )
}
