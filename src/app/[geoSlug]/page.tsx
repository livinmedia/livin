import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const revalidate = 0

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Props = { params: Promise<{ geoSlug: string }> }

const CAT_COLORS: Record<string, string> = {
  article: '#E85D2A', guide: '#2D7DD2', market_insight: '#22C580',
  event_roundup: '#8B5CF6', neighborhood_profile: '#DB2777',
  vendor_feature: '#B45309', relocation_guide: '#0D9488',
}

const ARTICLE_GRADS = [
  'linear-gradient(135deg, #FFECD2, #FCB69F)',
  'linear-gradient(135deg, #A1C4FD, #C2E9FB)',
  'linear-gradient(135deg, #D4FC79, #96E6A1)',
  'linear-gradient(135deg, #FCCB90, #D57EEB)',
  'linear-gradient(135deg, #E0C3FC, #8EC5FC)',
  'linear-gradient(135deg, #F5F7FA, #C3CFE2)',
]

const HOME_GRADS = [
  'linear-gradient(135deg, #FFECD2, #FCB69F)',
  'linear-gradient(135deg, #A1C4FD, #C2E9FB)',
  'linear-gradient(135deg, #D4FC79, #96E6A1)',
  'linear-gradient(135deg, #FCCB90, #D57EEB)',
]

const MVP_CAT_LABELS: Record<string, string> = {
  restaurant: 'Restaurant', salon: 'Salon & Beauty', auto_dealer: 'Auto',
  healthcare: 'Healthcare', fitness: 'Fitness', retail: 'Retail',
  services: 'Services', other: 'Business',
}

// ── Resolve city ──
async function resolveCity(slug: string) {
  const { data: city } = await supabase
    .from('cities')
    .select('id, name, slug, population, latitude, longitude, timezone, is_pilot, has_market_mayor, content_status, metadata, state_region_id')
    .eq('slug', slug)
    .single()
  if (!city) return null
  const { data: state } = await supabase
    .from('states_regions')
    .select('name, slug, abbreviation')
    .eq('id', city.state_region_id)
    .single()
  return { ...city, state }
}

// ── Metadata ──
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { geoSlug } = await params
  const city = await resolveCity(geoSlug)
  if (!city) return { title: 'Not Found' }
  const abbr = city.state?.abbreviation?.toUpperCase() || ''
  return {
    title: `LIVIN in ${city.name}${abbr ? `, ${abbr}` : ''} — City Guide`,
    description: `Discover food, culture, neighborhoods, real estate, and lifestyle in ${city.name}. Your LIVIN city guide powered by local Market Mayors.`,
  }
}

// ── Page ──
export default async function CityPage({ params }: Props) {
  const { geoSlug } = await params
  const city = await resolveCity(geoSlug)
  if (!city) notFound()

  const stateAbbr = city.state?.abbreviation?.toUpperCase() || ''

  // Fetch all city data in parallel
  const [articlesRes, mmRes, mvpsRes] = await Promise.all([
    supabase
      .from('content_records')
      .select('id, title, slug, excerpt, category, content_type, published_at, word_count, hero_image_url')
      .eq('city_id', city.id)
      .eq('brand', 'livin')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(12),
    supabase
      .from('market_mayors')
      .select('id, bio, specialty_areas, license_number, license_state, is_featured, social_links, user_id')
      .eq('city_id', city.id)
      .limit(5),
    supabase
      .from('market_vendor_partners')
      .select('id, business_name, business_category, business_subcategory, description, address, phone, website_url, ad_tier, is_active')
      .eq('city_id', city.id)
      .eq('is_active', true)
      .order('ad_tier', { ascending: false })
      .limit(8),
  ])

  const articles = articlesRes.data || []
  const marketMayors = mmRes.data || []
  const mvps = mvpsRes.data || []

  // Fetch MM profiles
  const mmProfiles: Record<string, { full_name: string; avatar_url: string | null; email: string }> = {}
  for (const mm of marketMayors) {
    if (mm.user_id) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url, email')
        .eq('id', mm.user_id)
        .single()
      if (profile) mmProfiles[mm.id] = profile
    }
  }

  // Article layout splits
  const featuredArticle = articles[0] || null
  const firstGridArticles = articles.slice(1, 4)
  const secondGridArticles = articles.slice(4, 7)
  const moreArticles = articles.slice(7)

  // MVP splits
  const featuredMvps = mvps.filter(m => m.ad_tier === 'premium' || m.ad_tier === 'category_exclusive' || m.ad_tier === 'featured')
  const standardMvps = mvps.filter(m => m.ad_tier === 'basic')

  // Hot topics — derive from latest articles or use defaults
  const hotTopics = [
    {
      icon: '★',
      iconStyle: 'linear-gradient(135deg, #FFF5ED, #FFECD2)',
      iconColor: '#E85D2A',
      label: 'Hot topic',
      value: articles[0]?.title?.slice(0, 30) || `What's trending in ${city.name}`,
      href: articles[0] ? `/${geoSlug}/${articles[0].slug}` : '#',
    },
    {
      icon: '⌂',
      iconStyle: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
      iconColor: '#2D7DD2',
      label: 'Hot homes',
      value: `New listings in ${city.name}`,
      href: '#homes',
    },
    {
      icon: '♨',
      iconStyle: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
      iconColor: '#22C580',
      label: 'Hot eats',
      value: articles.find(a => a.category === 'food' || a.content_type === 'article')?.title?.slice(0, 28) || `Best restaurants in ${city.name}`,
      href: articles.find(a => a.category === 'food')
        ? `/${geoSlug}/${articles.find(a => a.category === 'food')!.slug}`
        : '#',
    },
  ]

  return (
    <>
      <Nav />

      {/* ═══════════════════════════════════════════════
          HERO — Hot topics instead of boring stats
          ═══════════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: 'clamp(40px, 5vw, 64px) 0 clamp(32px, 4vw, 48px)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'var(--lv-warm-bg)', opacity: 0.5,
        }} />
        <div className="lv-container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '16px', fontSize: '13px', color: 'var(--lv-text-muted)',
          }}>
            <a href="/" style={{ color: 'var(--lv-text-muted)' }}>LIVIN</a>
            <span style={{ color: 'var(--lv-text-light)' }}>/</span>
            {city.state && (
              <>
                <a href={`/${city.state.slug}`} style={{ color: 'var(--lv-text-muted)' }}>{city.state.name}</a>
                <span style={{ color: 'var(--lv-text-light)' }}>/</span>
              </>
            )}
            <span style={{ color: 'var(--lv-black)', fontWeight: 500 }}>{city.name}</span>
          </div>

          {city.is_pilot && (
            <span style={{
              display: 'inline-flex', padding: '4px 14px',
              background: '#fff', border: '1px solid var(--lv-border)',
              borderRadius: 'var(--radius-pill)', marginBottom: '14px',
              fontSize: '11px', fontWeight: 600, color: 'var(--lv-orange)',
            }}>
              Pilot city
            </span>
          )}

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            color: 'var(--lv-black)', lineHeight: 1.06,
            letterSpacing: '-0.03em', marginBottom: '12px',
          }}>
            LIVIN in{' '}
            <Em>{city.name}</Em>
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 1.8vw, 18px)', fontWeight: 300,
            color: 'var(--lv-text-muted)', lineHeight: 1.6,
            maxWidth: '540px', marginBottom: '28px',
          }}>
            Food, culture, neighborhoods, real estate, and lifestyle in {city.name}{stateAbbr ? `, ${stateAbbr}` : ''}.
            Your city guide powered by local experts.
          </p>

          {/* Hot topics row */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
          }}>
            {hotTopics.map((topic, i) => (
              <a key={i} href={topic.href} style={{
                display: 'flex', gap: '12px', alignItems: 'center',
                padding: '14px 16px', background: '#fff',
                border: '1px solid var(--lv-border)', borderRadius: 'var(--radius)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: topic.iconStyle, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', color: topic.iconColor, flexShrink: 0,
                }}>
                  {topic.icon}
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--lv-black)', marginBottom: '1px' }}>
                    {topic.label}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 300, color: 'var(--lv-text-muted)' }}>
                    {topic.value}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          ARTICLES — Content-heavy, featured + grid
          ═══════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(40px, 5vw, 64px) 0', background: 'var(--lv-cream)' }}>
        <div className="lv-container">
          <SectionHeader eyebrow={`LIVIN in ${city.name}`} eyebrowColor="var(--lv-blue)"
            title={<>City guides & <Em>articles</Em></>}
            subtitle={`Editorial content curated for ${city.name}. Powered by AI, approved by your Market Mayor.`}
          />

          {featuredArticle ? (
            <>
              {/* Featured article — split layout */}
              <a href={`/${geoSlug}/${featuredArticle.slug}`} style={{
                display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0',
                background: '#fff', borderRadius: 'var(--radius)', overflow: 'hidden',
                border: '1px solid var(--lv-border)', marginBottom: '14px',
                transition: 'transform 0.25s, box-shadow 0.25s',
              }}>
                <div style={{
                  minHeight: '240px',
                  background: featuredArticle.hero_image_url
                    ? `url(${featuredArticle.hero_image_url}) center/cover`
                    : ARTICLE_GRADS[0],
                }} />
                <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: CAT_COLORS[featuredArticle.content_type] || 'var(--lv-orange)', marginBottom: '8px' }}>
                    {(featuredArticle.category || featuredArticle.content_type || '').replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--lv-black)', lineHeight: 1.15, marginBottom: '10px' }}>
                    {featuredArticle.title}
                  </div>
                  {featuredArticle.excerpt && (
                    <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--lv-text-muted)', lineHeight: 1.6, marginBottom: '12px' }}>
                      {featuredArticle.excerpt}
                    </p>
                  )}
                  <div style={{ fontSize: '12px', color: 'var(--lv-text-light)' }}>
                    {featuredArticle.word_count ? `${featuredArticle.word_count} words · ` : ''}
                    {featuredArticle.published_at ? new Date(featuredArticle.published_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                  </div>
                </div>
              </a>

              {/* First grid of articles */}
              {firstGridArticles.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {firstGridArticles.map((article, i) => (
                    <ArticleCard key={article.id} article={article} geoSlug={geoSlug} index={i + 1} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{
              padding: '56px 24px', textAlign: 'center', background: '#fff',
              borderRadius: 'var(--radius)', border: '1px solid var(--lv-border)',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: 'var(--lv-border)', marginBottom: '14px' }}>LIVIN</div>
              <p style={{ fontWeight: 600, color: 'var(--lv-black)', marginBottom: '6px' }}>Content coming soon for {city.name}</p>
              <p style={{ fontSize: '13px', color: 'var(--lv-text-muted)' }}>Our AI content pipeline is generating guides and articles for this city.</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HOMES FOR SALE
          ═══════════════════════════════════════════════ */}
      <section id="homes" style={{ padding: 'clamp(40px, 5vw, 64px) 0', background: 'var(--lv-white)' }}>
        <div className="lv-container">
          <SectionHeader eyebrow="Homes for sale" eyebrowColor="var(--lv-orange)"
            title={<>Real estate in <Em>{city.name}</Em></>}
            subtitle={`Featured homes and new listings${marketMayors.length > 0 ? ' curated by your Market Mayor' : ''}.`}
          />

          {/* Placeholder homes — will be replaced by real listing data */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { price: '$485,000', addr: 'Coming soon', hood: city.name, beds: 3, baths: 2, sqft: '1,840', badge: 'New', grad: HOME_GRADS[0] },
              { price: '$725,000', addr: 'Coming soon', hood: city.name, beds: 4, baths: 3, sqft: '2,650', badge: null, grad: HOME_GRADS[1] },
              { price: '$1,250,000', addr: 'Coming soon', hood: city.name, beds: 5, baths: 4, sqft: '4,200', badge: 'Featured', grad: HOME_GRADS[2] },
            ].map((home, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 'var(--radius)', overflow: 'hidden',
                border: '1px solid var(--lv-border)', transition: 'transform 0.25s',
              }}>
                <div style={{
                  height: '160px', background: home.grad, position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute', bottom: '10px', left: '12px',
                    padding: '5px 14px', background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)', borderRadius: 'var(--radius-pill)',
                    fontSize: '14px', fontWeight: 600, color: '#fff',
                  }}>
                    {home.price}
                  </span>
                  {home.badge && (
                    <span style={{
                      position: 'absolute', top: '10px', right: '12px',
                      padding: '3px 10px', background: 'var(--lv-orange)',
                      borderRadius: 'var(--radius-pill)', fontSize: '9px',
                      fontWeight: 700, color: '#fff', letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}>
                      {home.badge}
                    </span>
                  )}
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lv-black)', marginBottom: '2px' }}>
                    {home.addr}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--lv-text-muted)', marginBottom: '8px' }}>
                    {home.hood}{stateAbbr ? `, ${stateAbbr}` : ''}
                  </div>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--lv-text-muted)' }}>
                    <span>{home.beds} bed</span>
                    <span>{home.baths} bath</span>
                    <span>{home.sqft} sqft</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <a href="#" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--lv-orange)' }}>
              View all {city.name} listings →
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          MORE ARTICLES (second batch)
          ═══════════════════════════════════════════════ */}
      {secondGridArticles.length > 0 && (
        <section style={{ padding: 'clamp(40px, 5vw, 64px) 0', background: 'var(--lv-cream)' }}>
          <div className="lv-container">
            <SectionHeader eyebrow="More stories" eyebrowColor="var(--lv-purple)"
              title={<>Keep exploring <Em>{city.name}</Em></>} subtitle=""
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {secondGridArticles.map((article, i) => (
                <ArticleCard key={article.id} article={article} geoSlug={geoSlug} index={i + 4} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          MVPs — Local business partners (ABOVE Market Mayor)
          ═══════════════════════════════════════════════ */}
      {mvps.length > 0 && (
        <section style={{ padding: 'clamp(40px, 5vw, 64px) 0', background: 'var(--lv-white)' }}>
          <div className="lv-container">
            <SectionHeader eyebrow="Local partners" eyebrowColor="var(--lv-green)"
              title={<>Trusted businesses in <GreenEm>{city.name}</GreenEm></>}
              subtitle={`LIVIN partners with the best local businesses in ${city.name}.`}
            />

            {featuredMvps.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: standardMvps.length > 0 ? '12px' : '0',
              }}>
                {featuredMvps.map(mvp => <MvpCard key={mvp.id} mvp={mvp} featured />)}
              </div>
            )}

            {standardMvps.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {standardMvps.map(mvp => <MvpCard key={mvp.id} mvp={mvp} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          MARKET MAYOR — At the bottom, the trust anchor
          ═══════════════════════════════════════════════ */}
      {marketMayors.length > 0 && (
        <section style={{ padding: 'clamp(40px, 5vw, 64px) 0', background: 'var(--lv-cream)' }}>
          <div className="lv-container">
            <SectionHeader eyebrow="Your Market Mayor" eyebrowColor="var(--lv-orange)"
              title={<>Meet your local expert in <Em>{city.name}</Em></>}
              subtitle={`Your Market Mayor is a licensed real estate professional and community leader who curates the LIVIN experience in ${city.name}.`}
            />

            <div style={{
              display: 'grid',
              gridTemplateColumns: marketMayors.length > 1 ? 'repeat(2, 1fr)' : '1fr',
              gap: '14px',
              maxWidth: marketMayors.length === 1 ? '620px' : undefined,
              margin: marketMayors.length === 1 ? '0 auto' : undefined,
            }}>
              {marketMayors.map(mm => {
                const profile = mmProfiles[mm.id]
                const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'MM'
                const firstName = profile?.full_name?.split(' ')[0] || 'Market Mayor'

                return (
                  <div key={mm.id} style={{
                    background: '#fff', border: '1px solid var(--lv-border)',
                    borderRadius: 'var(--radius)', padding: '28px',
                    display: 'flex', gap: '20px', alignItems: 'flex-start',
                  }}>
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #FF9A5C, #E85D2A)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontSize: '24px',
                      color: '#fff', flexShrink: 0, overflow: 'hidden',
                    }}>
                      {profile?.avatar_url
                        ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : initials}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--lv-black)' }}>
                          {profile?.full_name || 'Market Mayor'}
                        </span>
                        <span style={{
                          padding: '3px 10px', background: 'linear-gradient(135deg, #FFF5ED, #FEF0E4)',
                          border: '1px solid var(--lv-border)', borderRadius: 'var(--radius-pill)',
                          fontSize: '10px', fontWeight: 700, color: 'var(--lv-orange)',
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}>
                          Market Mayor
                        </span>
                      </div>

                      {mm.license_number && (
                        <div style={{ fontSize: '12px', color: 'var(--lv-text-light)', marginBottom: '8px' }}>
                          License #{mm.license_number}{mm.license_state ? ` · ${mm.license_state}` : ''}
                        </div>
                      )}

                      {mm.bio && (
                        <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--lv-text-muted)', lineHeight: 1.6, marginBottom: '12px' }}>
                          {mm.bio}
                        </p>
                      )}

                      {mm.specialty_areas && mm.specialty_areas.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                          {mm.specialty_areas.map((area: string) => (
                            <span key={area} style={{
                              padding: '4px 12px', background: 'var(--lv-cream)',
                              borderRadius: 'var(--radius-pill)', fontSize: '11px',
                              fontWeight: 500, color: 'var(--lv-text-muted)',
                            }}>
                              {area}
                            </span>
                          ))}
                        </div>
                      )}

                      <a href="#" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '10px 24px', background: 'var(--lv-orange-grad)',
                        color: '#fff', borderRadius: 'var(--radius-pill)',
                        fontSize: '13px', fontWeight: 600,
                        boxShadow: '0 4px 16px rgba(232,93,42,0.2)',
                      }}>
                        Contact {firstName} →
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          EVEN MORE ARTICLES (overflow)
          ═══════════════════════════════════════════════ */}
      {moreArticles.length > 0 && (
        <section style={{ padding: 'clamp(40px, 5vw, 64px) 0', background: marketMayors.length > 0 ? 'var(--lv-white)' : 'var(--lv-cream)' }}>
          <div className="lv-container">
            <SectionHeader eyebrow="Even more" eyebrowColor="var(--lv-blue)"
              title={<>Deep dive into <Em>{city.name}</Em></>} subtitle=""
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {moreArticles.map((article, i) => (
                <ArticleCard key={article.id} article={article} geoSlug={geoSlug} index={i + 7} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          CTA — Join the network
          ═══════════════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(48px, 6vw, 80px) 0',
        background: 'var(--lv-warm-bg)', textAlign: 'center',
      }}>
        <div className="lv-container">
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--lv-orange)', marginBottom: '14px' }}>
            Join LIVIN in {city.name}
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 3.5vw, 36px)',
            color: 'var(--lv-black)', lineHeight: 1.15,
            maxWidth: '480px', margin: '0 auto 16px',
          }}>
            {marketMayors.length === 0
              ? <>This city needs a <Em>Market Mayor</Em></>
              : <>Be part of the LIVIN <Em>network</Em></>
            }
          </h2>
          <p style={{
            fontSize: '15px', fontWeight: 300, color: 'var(--lv-text-muted)',
            lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 28px',
          }}>
            {marketMayors.length === 0
              ? `${city.name} is looking for a licensed real estate professional to lead as Market Mayor.`
              : `Promote your business to the LIVIN audience in ${city.name}. Become a Market Vendor Partner.`
            }
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {marketMayors.length === 0 && (
              <a href="#" style={{
                padding: '14px 28px', background: 'var(--lv-orange-grad)',
                color: '#fff', borderRadius: 'var(--radius-pill)',
                fontSize: '15px', fontWeight: 600,
                boxShadow: '0 4px 20px rgba(232,93,42,0.2)',
              }}>
                Apply as Market Mayor →
              </a>
            )}
            <a href="#" style={{
              padding: '14px 28px', background: '#fff',
              color: 'var(--lv-black)', border: '1px solid var(--lv-border)',
              borderRadius: 'var(--radius-pill)', fontSize: '15px', fontWeight: 500,
            }}>
              Become a partner
            </a>
          </div>
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
    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: eyebrowColor, marginBottom: '10px' }}>{eyebrow}</p>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3.5vw, 36px)', color: 'var(--lv-black)', lineHeight: 1.12, marginBottom: '8px' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--lv-text-muted)', maxWidth: '480px', margin: '0 auto' }}>{subtitle}</p>}
    </div>
  )
}

function Em({ children }: { children: React.ReactNode }) {
  return <span style={{ fontStyle: 'italic', background: 'var(--lv-orange-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{children}</span>
}

function GreenEm({ children }: { children: React.ReactNode }) {
  return <span style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #22C580, #2AB7A9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{children}</span>
}

function ArticleCard({ article, geoSlug, index }: {
  article: { id: string; title: string; slug: string; excerpt: string | null; category: string | null; content_type: string; hero_image_url: string | null; word_count: number | null }
  geoSlug: string; index: number
}) {
  const imgBg = article.hero_image_url
    ? `url(${article.hero_image_url}) center/cover`
    : ARTICLE_GRADS[index % ARTICLE_GRADS.length]
  const catColor = CAT_COLORS[article.content_type] || CAT_COLORS[article.category || ''] || 'var(--lv-orange)'

  return (
    <a href={`/${geoSlug}/${article.slug}`} style={{
      background: '#fff', borderRadius: 'var(--radius)', overflow: 'hidden',
      border: '1px solid var(--lv-border)', transition: 'transform 0.25s, box-shadow 0.25s',
      display: 'block',
    }}>
      <div style={{ height: '140px', background: imgBg }} />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: catColor, marginBottom: '6px' }}>
          {(article.category || article.content_type || '').replace(/_/g, ' ')}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--lv-black)', lineHeight: 1.2, marginBottom: '6px' }}>
          {article.title}
        </div>
        {article.excerpt && (
          <p style={{ fontSize: '12px', fontWeight: 300, color: 'var(--lv-text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {article.excerpt}
          </p>
        )}
        {article.word_count && (
          <div style={{ fontSize: '11px', color: 'var(--lv-text-light)', marginTop: '8px' }}>
            {Math.round(article.word_count / 200)} min read
          </div>
        )}
      </div>
    </a>
  )
}

function MvpCard({ mvp, featured }: {
  mvp: { id: string; business_name: string; business_category: string; business_subcategory: string | null; description: string | null; address: string | null; phone: string | null; website_url: string | null; ad_tier: string }
  featured?: boolean
}) {
  const catLabel = MVP_CAT_LABELS[mvp.business_category] || mvp.business_category

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--lv-border)',
      borderRadius: 'var(--radius)', padding: featured ? '22px' : '16px',
      transition: 'transform 0.25s, box-shadow 0.25s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{
            fontFamily: featured ? 'var(--font-display)' : 'var(--font-body)',
            fontSize: featured ? '19px' : '14px',
            fontWeight: featured ? 400 : 600,
            color: 'var(--lv-black)', marginBottom: '2px',
          }}>
            {mvp.business_name}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--lv-text-muted)' }}>
            {catLabel}{mvp.business_subcategory ? ` · ${mvp.business_subcategory}` : ''}
          </div>
        </div>
        {mvp.ad_tier !== 'basic' && (
          <span style={{
            padding: '3px 10px', borderRadius: 'var(--radius-pill)',
            fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: mvp.ad_tier === 'premium' || mvp.ad_tier === 'category_exclusive' ? 'var(--lv-orange)' : 'var(--lv-blue)',
            background: mvp.ad_tier === 'premium' || mvp.ad_tier === 'category_exclusive' ? '#FFF5ED' : '#EFF6FF',
            border: `1px solid ${mvp.ad_tier === 'premium' || mvp.ad_tier === 'category_exclusive' ? '#FDDCBB' : '#BFDBFE'}`,
          }}>
            {mvp.ad_tier === 'category_exclusive' ? 'Exclusive' : mvp.ad_tier}
          </span>
        )}
      </div>

      {mvp.description && (
        <p style={{
          fontSize: '13px', fontWeight: 300, color: 'var(--lv-text-muted)',
          lineHeight: 1.5, marginBottom: '10px',
          display: '-webkit-box', WebkitLineClamp: featured ? 3 : 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {mvp.description}
        </p>
      )}

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--lv-text-muted)' }}>
        {mvp.address && <span>{mvp.address}</span>}
        {mvp.phone && <span>{mvp.phone}</span>}
      </div>

      {mvp.website_url && (
        <a href={mvp.website_url} target="_blank" rel="noopener" style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          marginTop: '10px', fontSize: '13px', fontWeight: 500, color: 'var(--lv-orange)',
        }}>
          Visit website →
        </a>
      )}
    </div>
  )
}
