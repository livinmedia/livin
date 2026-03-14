import { createClient } from '@supabase/supabase-js'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

// Revalidate every hour — fresh content rotates in
export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Color palette for city cards ──
const CITY_COLORS: Record<string, string> = {
  'houston-texas': 'linear-gradient(135deg, #34D399, #15925C)',
  'miami-florida': 'linear-gradient(135deg, #FF9A5C, #E85D2A)',
  'new-york-new-york': 'linear-gradient(135deg, #5BA4F5, #1A5FA4)',
  'los-angeles-california': 'linear-gradient(135deg, #FFBE5C, #E87A2A)',
  'nashville-tennessee': 'linear-gradient(135deg, #A78BFA, #7C3AED)',
  'scottsdale-arizona': 'linear-gradient(135deg, #FBBF24, #B45309)',
  'denver-colorado': 'linear-gradient(135deg, #5BA4F5, #2563EB)',
  'chicago-illinois': 'linear-gradient(135deg, #F472B6, #DB2777)',
  'dallas-texas': 'linear-gradient(135deg, #34D399, #059669)',
  'charleston-south-carolina': 'linear-gradient(135deg, #FDA4AF, #E11D48)',
}

const FALLBACK_COLORS = [
  'linear-gradient(135deg, #FF9A5C, #E85D2A)',
  'linear-gradient(135deg, #5BA4F5, #1A5FA4)',
  'linear-gradient(135deg, #34D399, #15925C)',
  'linear-gradient(135deg, #A78BFA, #7C3AED)',
  'linear-gradient(135deg, #FBBF24, #B45309)',
  'linear-gradient(135deg, #F472B6, #DB2777)',
]

// Vibe descriptions for cities
const CITY_VIBES: Record<string, string> = {
  'houston-texas': 'Space city energy',
  'miami-florida': 'Tropical ambition',
  'new-york-new-york': 'Relentless possibility',
  'los-angeles-california': 'Eternal horizon',
  'nashville-tennessee': 'Creative heartbeat',
  'scottsdale-arizona': 'Desert luxury',
  'denver-colorado': 'Mountain momentum',
  'chicago-illinois': 'Bold and brilliant',
  'dallas-texas': 'Texas-sized ambition',
  'charleston-south-carolina': 'Southern grace',
}

// Article image gradients (until real hero_image_url is populated)
const ARTICLE_GRADIENTS = [
  'linear-gradient(135deg, #FFECD2, #FCB69F)',
  'linear-gradient(135deg, #A1C4FD, #C2E9FB)',
  'linear-gradient(135deg, #D4FC79, #96E6A1)',
  'linear-gradient(135deg, #FCCB90, #D57EEB)',
]

// Category colors
const CAT_COLORS: Record<string, string> = {
  article: '#E85D2A',
  guide: '#2D7DD2',
  market_insight: '#22C580',
  event_roundup: '#8B5CF6',
  neighborhood_profile: '#DB2777',
  vendor_feature: '#B45309',
  relocation_guide: '#0D9488',
}

function getCityColor(slug: string, index: number): string {
  return CITY_COLORS[slug] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

export default async function HomePage() {
  // ── Fetch cities with state info ──
  const { data: cities } = await supabase
    .from('cities')
    .select('id, name, slug, population, is_pilot, is_top_100, state_region_id')
    .eq('is_active', true)
    .order('launch_priority', { ascending: true })
    .limit(100)

  // ── Fetch states for region labels ──
  const { data: states } = await supabase
    .from('states_regions')
    .select('id, name, abbreviation')

  // ── Fetch latest published articles across ALL cities ──
  const { data: articles } = await supabase
    .from('content_records')
    .select('id, title, slug, excerpt, category, content_type, published_at, city_id, hero_image_url')
    .eq('brand', 'livin')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(4)

  // Build lookup maps
  const stateMap = new Map(states?.map(s => [s.id, s]) || [])
  const cityMap = new Map(cities?.map(c => [c.id, c]) || [])

  const cityCount = cities?.length || 0

  // ── Hero cities: pick top 3 (pilot first, then most content) ──
  const heroCities = (cities || []).slice(0, 3)

  // ── Featured cities: next 6 after hero ──
  const featuredCities = (cities || []).slice(0, 6)

  // ── All city names for ticker ──
  const tickerCities = (cities || []).slice(0, 20).map(c => c.name)

  // ── Lifestyle discovery themes ──
  const lifestyleThemes = [
    { title: 'Coastal', desc: 'Salt air, open water', icon: '〰', gradient: 'linear-gradient(150deg, #E0F4FF, #7CC8ED)' },
    { title: 'Mountain', desc: 'Altitude, quiet power', icon: '△', gradient: 'linear-gradient(150deg, #E8F5E8, #6BBF6B)' },
    { title: 'Urban pulse', desc: 'Density, electric energy', icon: '▪', gradient: 'linear-gradient(150deg, #F0ECF8, #9B85D6)' },
    { title: 'Wellness', desc: 'Space to breathe', icon: '○', gradient: 'linear-gradient(150deg, #FFF5E8, #FFC87C)' },
    { title: 'Luxury', desc: 'Rare air, curated', icon: '◇', gradient: 'linear-gradient(150deg, #F5F0E8, #C8B090)' },
    { title: 'Family', desc: 'Parks, schools, Sundays', icon: '⌂', gradient: 'linear-gradient(150deg, #FFF0F0, #FFB0B0)' },
  ]

  return (
    <>
      <Nav />

      {/* ═══════════════════════════════════════════════
          HERO — Split layout with city cards
          ═══════════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: 'clamp(48px, 6vw, 80px) 0 clamp(48px, 6vw, 72px)',
      }}>
        {/* Warm gradient background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--lv-warm-bg)',
          opacity: 0.5,
        }} />

        <div className="lv-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="lv-hero-split">
            {/* Left — Copy */}
            <div style={{ maxWidth: '480px' }}>
              <div className="fade-up" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                background: '#fff',
                border: '1px solid var(--lv-border)',
                borderRadius: 'var(--radius-pill)',
                marginBottom: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: 'var(--lv-green)',
                  animation: 'pulse 2.5s ease-in-out infinite',
                }} />
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--lv-text-muted)' }}>
                  {cityCount} cities and growing
                </span>
              </div>

              <h1 className="fade-up d1" style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(40px, 5.5vw, 64px)',
                color: 'var(--lv-black)',
                lineHeight: 1.06,
                letterSpacing: '-0.03em',
                marginBottom: '18px',
              }}>
                Discover where<br />
                <span style={{
                  fontStyle: 'italic',
                  background: 'var(--lv-orange-grad)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  you belong
                </span>
              </h1>

              <p className="fade-up d2" style={{
                fontSize: 'clamp(15px, 1.8vw, 18px)',
                fontWeight: 300,
                color: 'var(--lv-text-muted)',
                lineHeight: 1.6,
                marginBottom: '32px',
              }}>
                Cities, lifestyle, and possibility — converging on one platform.
                Explore how the world lives.
              </p>

              <div className="fade-up d3" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a href="#cities" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 28px',
                  background: 'var(--lv-orange-grad)',
                  color: '#fff',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '15px',
                  fontWeight: 600,
                  boxShadow: '0 4px 20px rgba(232,93,42,0.2)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}>
                  Explore cities →
                </a>
                <a href="#philosophy" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '14px 28px',
                  background: '#fff',
                  color: 'var(--lv-black)',
                  border: '1px solid var(--lv-border)',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '15px',
                  fontWeight: 500,
                }}>
                  How it works
                </a>
              </div>
            </div>

            {/* Right — City card mosaic */}
            <div className="fade-up d2" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}>
              {heroCities.map((city, i) => {
                const state = stateMap.get(city.state_region_id)
                const isFirst = i === 0
                return (
                  <a
                    key={city.slug}
                    href={`/${city.slug}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: '18px',
                      borderRadius: '18px',
                      background: getCityColor(city.slug, i),
                      minHeight: isFirst ? '180px' : '140px',
                      gridColumn: isFirst ? 'span 2' : undefined,
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                      transition: 'transform 0.3s cubic-bezier(0.23,1,0.32,1)',
                    }}
                  >
                    {/* Ghost letter */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      right: '16px',
                      transform: 'translateY(-50%)',
                      fontFamily: 'var(--font-display)',
                      fontSize: isFirst ? '100px' : '72px',
                      color: 'rgba(255,255,255,0.12)',
                      lineHeight: 1,
                      userSelect: 'none',
                    }}>
                      {city.name[0]}
                    </div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.7)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        marginBottom: '3px',
                      }}>
                        {state?.name || ''}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: isFirst ? '28px' : '20px',
                        color: '#fff',
                      }}>
                        {city.name}
                      </div>
                      {isFirst && CITY_VIBES[city.slug] && (
                        <div style={{
                          fontSize: '12px',
                          fontStyle: 'italic',
                          color: 'rgba(255,255,255,0.65)',
                          marginTop: '2px',
                        }}>
                          {CITY_VIBES[city.slug]}
                        </div>
                      )}
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TICKER — Scrolling city names on warm gradient
          ═══════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #FFF5ED, #FEF0E4, #F5F0FF)',
        padding: '12px 0',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        borderTop: '1px solid var(--lv-border)',
        borderBottom: '1px solid var(--lv-border)',
      }}>
        <div style={{
          display: 'inline-flex',
          animation: 'marquee 30s linear infinite',
        }}>
          {/* Repeat twice for seamless loop */}
          {[...tickerCities, ...tickerCities].map((name, i) => (
            <span key={i} style={{
              padding: '0 20px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#C4946A',
              letterSpacing: '0.02em',
            }}>
              {name} <span style={{ color: 'var(--lv-orange)', fontSize: '7px', verticalAlign: 'middle' }}>●</span>
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          CITIES — 3x3 symmetric grid, all link to city pages
          ═══════════════════════════════════════════════ */}
      <section id="cities" style={{ padding: 'clamp(48px, 6vw, 80px) 0', background: 'var(--lv-white)' }}>
        <div className="lv-container">
          <SectionHeader eyebrow="Places" eyebrowColor="var(--lv-blue)" title={<>Every city is a different <Em>way of LIVIN</Em></>} subtitle="Tap into the rhythm of a place. Click any city to go deeper." />

          {/* Top row — larger cards */}
          <div className="lv-grid-3" style={{ marginBottom: '12px' }}>
            {featuredCities.slice(0, 3).map((city, i) => (
              <CityCard key={city.slug} city={city} state={stateMap.get(city.state_region_id)} index={i} size="lg" />
            ))}
          </div>

          {/* Bottom row — smaller cards */}
          <div className="lv-grid-3">
            {featuredCities.slice(3, 6).map((city, i) => (
              <CityCard key={city.slug} city={city} state={stateMap.get(city.state_region_id)} index={i + 3} size="sm" />
            ))}
          </div>

          {/* View all link */}
          {cityCount > 6 && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <a href="#" style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--lv-orange)',
              }}>
                View all {cityCount} cities →
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          DISCOVERY — Lifestyle themes
          ═══════════════════════════════════════════════ */}
      <section id="lifestyle" style={{ padding: 'clamp(48px, 6vw, 80px) 0', background: 'var(--lv-cream)' }}>
        <div className="lv-container">
          <SectionHeader eyebrow="Discovery" eyebrowColor="var(--lv-orange)" title={<>How do you want <Em>to live?</Em></>} subtitle="Not by bedrooms. Not by price. By the life you want to wake up to." />

          <div className="lv-grid-3" style={{ marginBottom: '12px' }}>
            {lifestyleThemes.slice(0, 3).map(theme => (
              <a key={theme.title} href="#" style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '22px 18px',
                borderRadius: 'var(--radius)',
                background: theme.gradient,
                minHeight: '130px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                transition: 'transform 0.25s',
              }}>
                <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.5)', marginBottom: 'auto' }}>{theme.icon}</span>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2px' }}>{theme.title}</div>
                <div style={{ fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.75)' }}>{theme.desc}</div>
              </a>
            ))}
          </div>
          <div className="lv-grid-3">
            {lifestyleThemes.slice(3, 6).map(theme => (
              <a key={theme.title} href="#" style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '22px 18px',
                borderRadius: 'var(--radius)',
                background: theme.gradient,
                minHeight: '130px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                transition: 'transform 0.25s',
              }}>
                <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.5)', marginBottom: 'auto' }}>{theme.icon}</span>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2px' }}>{theme.title}</div>
                <div style={{ fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.75)' }}>{theme.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          LATEST STORIES — From content_records, links to article pages
          ═══════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(48px, 6vw, 80px) 0', background: 'var(--lv-white)' }}>
        <div className="lv-container">
          <SectionHeader eyebrow="Latest stories" eyebrowColor="var(--lv-purple)" title={<>Fresh from the <Em>network</Em></>} subtitle="Editorial content generated daily across all cities. Click to read." />

          {articles && articles.length > 0 ? (
            <div className="lv-grid-2">
              {articles.map((article, i) => {
                const city = cityMap.get(article.city_id)
                const citySlug = city?.slug || ''
                const cityName = city?.name || 'LIVIN'
                const state = city ? stateMap.get(city.state_region_id) : null
                const stateAbbr = state?.abbreviation?.toUpperCase() || ''
                const catColor = CAT_COLORS[article.content_type] || CAT_COLORS[article.category || ''] || 'var(--lv-orange)'
                const imgBg = article.hero_image_url
                  ? `url(${article.hero_image_url}) center/cover`
                  : ARTICLE_GRADIENTS[i % ARTICLE_GRADIENTS.length]

                return (
                  <a
                    key={article.id}
                    href={`/${citySlug}/${article.slug}`}
                    style={{
                      background: '#fff',
                      borderRadius: 'var(--radius)',
                      overflow: 'hidden',
                      border: '1px solid var(--lv-border)',
                      transition: 'transform 0.25s, box-shadow 0.25s',
                    }}
                  >
                    {/* Image area */}
                    <div style={{
                      height: '140px',
                      background: imgBg,
                      position: 'relative',
                    }}>
                      <span style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '12px',
                        padding: '4px 12px',
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#fff',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}>
                        {cityName}{stateAbbr ? `, ${stateAbbr}` : ''}
                      </span>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: catColor,
                        marginBottom: '6px',
                      }}>
                        {(article.category || article.content_type || '').replace(/_/g, ' ')}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '18px',
                        color: 'var(--lv-black)',
                        lineHeight: 1.2,
                        marginBottom: '6px',
                      }}>
                        {article.title}
                      </div>
                      {article.excerpt && (
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 300,
                          color: 'var(--lv-text-muted)',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {article.excerpt}
                        </div>
                      )}
                    </div>
                  </a>
                )
              })}
            </div>
          ) : (
            /* Placeholder state when no content is published yet */
            <div className="lv-grid-2">
              {[
                { cat: 'Food & dining', title: 'Content coming soon', city: 'Houston, TX', grad: ARTICLE_GRADIENTS[0], color: '#E85D2A' },
                { cat: 'Neighborhoods', title: 'Content coming soon', city: 'Miami, FL', grad: ARTICLE_GRADIENTS[1], color: '#2D7DD2' },
                { cat: 'Culture', title: 'Content coming soon', city: 'Nashville, TN', grad: ARTICLE_GRADIENTS[2], color: '#22C580' },
                { cat: 'Lifestyle', title: 'Content coming soon', city: 'Scottsdale, AZ', grad: ARTICLE_GRADIENTS[3], color: '#8B5CF6' },
              ].map((placeholder, i) => (
                <div key={i} style={{
                  background: '#fff',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  border: '1px solid var(--lv-border)',
                }}>
                  <div style={{ height: '120px', background: placeholder.grad }} />
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: placeholder.color, marginBottom: '6px' }}>
                      {placeholder.cat}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--lv-black)', marginBottom: '4px' }}>
                      {placeholder.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--lv-text-light)' }}>
                      {placeholder.city} · Pipeline warming up
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PHILOSOPHY
          ═══════════════════════════════════════════════ */}
      <section id="philosophy" style={{
        padding: 'clamp(56px, 8vw, 100px) 0',
        background: 'var(--lv-warm-bg)',
        textAlign: 'center',
      }}>
        <div className="lv-container">
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--lv-orange)', marginBottom: '14px' }}>
            Philosophy
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 3.5vw, 36px)',
            color: 'var(--lv-black)',
            lineHeight: 1.2,
            maxWidth: '500px',
            margin: '0 auto 18px',
          }}>
            People don&apos;t choose addresses. They choose{' '}
            <span style={{
              fontStyle: 'italic',
              background: 'var(--lv-orange-grad)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>how they want to feel</span>
          </h2>
          <p style={{
            fontSize: '15px',
            fontWeight: 300,
            color: 'var(--lv-text-muted)',
            lineHeight: 1.6,
            maxWidth: '420px',
            margin: '0 auto 32px',
          }}>
            The rhythm of a city. The energy of a neighborhood. The quiet of
            a backyard. That is what LIVIN helps you discover.
          </p>
          <div className="lv-grid-4" style={{
            maxWidth: '520px',
            margin: '0 auto',
            gap: '10px',
          }}>
            {['Rhythm', 'Energy', 'Belonging', 'Possibility'].map(word => (
              <div key={word} style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                fontStyle: 'italic',
                color: 'var(--lv-black)',
                padding: '12px 0',
                background: '#fff',
                border: '1px solid var(--lv-border)',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}>
                {word}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PLATFORM — 4-column feature grid
          ═══════════════════════════════════════════════ */}
      <section id="about" style={{ padding: 'clamp(48px, 6vw, 80px) 0', background: 'var(--lv-cream)' }}>
        <div className="lv-container">
          <SectionHeader
            eyebrow="The platform"
            eyebrowColor="var(--lv-green)"
            title={<>A LIVIN network of <GreenEm>places and intelligence</GreenEm></>}
            subtitle="Behind every city is a growing layer of content, local discovery, and AI."
          />
          <div className="lv-grid-4">
            {[
              { color: '#FF8C3C', title: 'City intelligence', desc: 'Deep profiles, data, editorial craft' },
              { color: '#5BA4F5', title: 'Local ecosystem', desc: 'Businesses, services, community' },
              { color: '#22C580', title: 'Real estate', desc: 'When the time is right' },
              { color: '#F4B860', title: 'AI discovery', desc: 'Matching people to places' },
            ].map(card => (
              <div key={card.title} style={{
                padding: '24px 18px',
                background: '#fff',
                border: '1px solid var(--lv-border)',
                borderRadius: 'var(--radius)',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: card.color,
                  margin: '0 auto 14px',
                }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lv-black)', marginBottom: '4px' }}>{card.title}</div>
                <div style={{ fontSize: '12px', fontWeight: 300, color: 'var(--lv-text-muted)', lineHeight: 1.4 }}>{card.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CLOSE — CTA
          ═══════════════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(56px, 8vw, 100px) 0',
        background: 'var(--lv-warm-bg)',
        textAlign: 'center',
      }}>
        <div className="lv-container">
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--lv-orange)', marginBottom: '14px' }}>
            The future of place
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 42px)',
            color: 'var(--lv-black)',
            lineHeight: 1.1,
            marginBottom: '14px',
            maxWidth: '460px',
            margin: '0 auto 14px',
          }}>
            The world is full of places{' '}
            <span style={{
              fontStyle: 'italic',
              background: 'var(--lv-orange-grad)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>waiting to be discovered</span>
          </h2>
          <p style={{
            fontSize: '15px',
            fontWeight: 300,
            color: 'var(--lv-text-muted)',
            marginBottom: '28px',
          }}>
            LIVIN is where place meets possibility. We are just getting started.
          </p>
          <a href="/houston-texas" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 28px',
            background: 'var(--lv-orange-grad)',
            color: '#fff',
            borderRadius: 'var(--radius-pill)',
            fontSize: '15px',
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(232,93,42,0.2)',
            minHeight: '48px',
          }}>
            Start exploring →
          </a>
        </div>
      </section>

      <Footer />
    </>
  )
}

// ── Shared Components ──

function SectionHeader({ eyebrow, eyebrowColor, title, subtitle }: {
  eyebrow: string; eyebrowColor: string; title: React.ReactNode; subtitle: string
}) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: eyebrowColor, marginBottom: '10px' }}>{eyebrow}</p>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3.5vw, 36px)', color: 'var(--lv-black)', lineHeight: 1.12, marginBottom: '8px' }}>{title}</h2>
      <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--lv-text-muted)', maxWidth: '420px', margin: '0 auto' }}>{subtitle}</p>
    </div>
  )
}

function Em({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontStyle: 'italic',
      background: 'var(--lv-orange-grad)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    }}>
      {children}
    </span>
  )
}

function GreenEm({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontStyle: 'italic',
      background: 'linear-gradient(135deg, #22C580, #2AB7A9)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    }}>
      {children}
    </span>
  )
}

function CityCard({ city, state, index, size }: {
  city: { name: string; slug: string }
  state?: { name: string; abbreviation: string } | null
  index: number
  size: 'lg' | 'sm'
}) {
  return (
    <a
      href={`/${city.slug}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '18px',
        borderRadius: 'var(--radius)',
        background: getCityColor(city.slug, index),
        minHeight: size === 'lg' ? '180px' : '130px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        transition: 'transform 0.25s, box-shadow 0.25s',
      }}
    >
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontFamily: 'var(--font-display)',
        fontSize: size === 'lg' ? '120px' : '80px',
        color: 'rgba(255,255,255,0.1)',
        lineHeight: 1,
        userSelect: 'none',
      }}>
        {city.name[0]}
      </div>
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '14px',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.5)',
        background: 'rgba(255,255,255,0.15)',
        padding: '2px 10px',
        borderRadius: 'var(--radius-pill)',
      }}>
        {state?.abbreviation?.toUpperCase() || ''}
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '9px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>
          {state?.name || ''}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: size === 'lg' ? '26px' : '22px', color: '#fff' }}>
          {city.name}
        </div>
        {CITY_VIBES[city.slug] && size === 'lg' && (
          <div style={{ fontSize: '11px', fontStyle: 'italic', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
            {CITY_VIBES[city.slug]}
          </div>
        )}
      </div>
    </a>
  )
}
