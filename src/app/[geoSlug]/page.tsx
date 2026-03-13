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

type Props = { params: Promise<{ geoSlug: string }> }

// ── Category colors ──
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

const MVP_CAT_LABELS: Record<string, string> = {
  restaurant: 'Restaurant', salon: 'Salon & Beauty', auto_dealer: 'Auto',
  healthcare: 'Healthcare', fitness: 'Fitness', retail: 'Retail',
  services: 'Services', other: 'Business',
}

// ── Resolve geo slug ──
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

  // ── Fetch all city data in parallel ──
  const [articlesRes, mmRes, mvpsRes] = await Promise.all([
    // Articles
    supabase
      .from('content_records')
      .select('id, title, slug, excerpt, category, content_type, published_at, word_count, hero_image_url')
      .eq('city_id', city.id)
      .eq('brand', 'livin')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(12),
    // Market Mayor
    supabase
      .from('market_mayors')
      .select('id, bio, specialty_areas, license_number, license_state, is_featured, social_links, user_id')
      .eq('city_id', city.id)
      .limit(5),
    // MVPs
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

  // Fetch MM user profiles
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

  // Split articles for layout
  const featuredArticle = articles[0] || null
  const recentArticles = articles.slice(1, 7)
  const moreArticles = articles.slice(7)

  // Featured MVPs (premium/featured tier first)
  const featuredMvps = mvps.filter(m => m.ad_tier === 'premium' || m.ad_tier === 'category_exclusive' || m.ad_tier === 'featured')
  const standardMvps = mvps.filter(m => m.ad_tier === 'basic')

  const articleCount = articles.length

  return (
    <>
      <Nav />

      {/* ═══════════════════════════════════════════════
          CITY HERO
          ═══════════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: 'clamp(48px, 6vw, 72px) 0 clamp(40px, 5vw, 60px)',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--lv-warm-bg)',
          opacity: 0.5,
        }} />
        <div className="lv-container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
            fontSize: '13px',
            color: 'var(--lv-text-muted)',
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

          <div style={{ maxWidth: '640px' }}>
            {city.is_pilot && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 14px',
                background: '#fff',
                border: '1px solid var(--lv-border)',
                borderRadius: 'var(--radius-pill)',
                marginBottom: '16px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--lv-orange)',
              }}>
                Pilot city
              </div>
            )}

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 5vw, 56px)',
              color: 'var(--lv-black)',
              lineHeight: 1.06,
              letterSpacing: '-0.03em',
              marginBottom: '14px',
            }}>
              LIVIN in{' '}
              <span style={{
                fontStyle: 'italic',
                background: 'var(--lv-orange-grad)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {city.name}
              </span>
            </h1>

            <p style={{
              fontSize: 'clamp(15px, 1.8vw, 18px)',
              fontWeight: 300,
              color: 'var(--lv-text-muted)',
              lineHeight: 1.6,
            }}>
              Food, culture, neighborhoods, real estate, and lifestyle in {city.name}{stateAbbr ? `, ${stateAbbr}` : ''}.
              Your city guide powered by local experts.
            </p>
          </div>

          {/* City stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginTop: '32px',
          }}>
            <StatCard label="Population" value={city.population ? city.population.toLocaleString() : '—'} />
            <StatCard label="Articles" value={String(articleCount)} />
            <StatCard label="Market Mayor" value={marketMayors.length > 0 ? 'Active' : 'Open'} accent={marketMayors.length > 0} />
            <StatCard label="Local partners" value={String(mvps.length)} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          MARKET MAYOR — Featured real estate agent
          ═══════════════════════════════════════════════ */}
      {marketMayors.length > 0 && (
        <section style={{ padding: 'clamp(40px, 5vw, 64px) 0', background: 'var(--lv-white)' }}>
          <div className="lv-container">
            <SectionHeader
              eyebrow="Your Market Mayor"
              eyebrowColor="var(--lv-orange)"
              title={<>The trusted local expert in <Em>{city.name}</Em></>}
              subtitle={`Your Market Mayor is a licensed real estate professional and community leader who curates the LIVIN experience in ${city.name}.`}
            />

            <div style={{
              display: 'grid',
              gridTemplateColumns: marketMayors.length > 1 ? 'repeat(2, 1fr)' : '1fr',
              gap: '16px',
              maxWidth: marketMayors.length === 1 ? '600px' : undefined,
              margin: marketMayors.length === 1 ? '0 auto' : undefined,
            }}>
              {marketMayors.map(mm => {
                const profile = mmProfiles[mm.id]
                const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'MM'
                return (
                  <div key={mm.id} style={{
                    background: '#fff',
                    border: '1px solid var(--lv-border)',
                    borderRadius: 'var(--radius)',
                    padding: '28px',
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'flex-start',
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #FF9A5C, #E85D2A)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: '24px',
                      color: '#fff',
                      flexShrink: 0,
                    }}>
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : initials}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '22px',
                          color: 'var(--lv-black)',
                        }}>
                          {profile?.full_name || 'Market Mayor'}
                        </span>
                        <span style={{
                          padding: '3px 10px',
                          background: 'linear-gradient(135deg, #FFF5ED, #FEF0E4)',
                          border: '1px solid var(--lv-border)',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: 'var(--lv-orange)',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}>
                          Market Mayor
                        </span>
                      </div>

                      {mm.license_number && (
                        <div style={{ fontSize: '12px', color: 'var(--lv-text-muted)', marginBottom: '8px' }}>
                          License #{mm.license_number}{mm.license_state ? ` · ${mm.license_state}` : ''}
                        </div>
                      )}

                      {mm.bio && (
                        <p style={{
                          fontSize: '14px',
                          fontWeight: 300,
                          color: 'var(--lv-text-muted)',
                          lineHeight: 1.6,
                          marginBottom: '12px',
                        }}>
                          {mm.bio}
                        </p>
                      )}

                      {mm.specialty_areas && mm.specialty_areas.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                          {mm.specialty_areas.map((area: string) => (
                            <span key={area} style={{
                              padding: '4px 12px',
                              background: 'var(--lv-cream)',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '11px',
                              fontWeight: 500,
                              color: 'var(--lv-text-muted)',
                            }}>
                              {area}
                            </span>
                          ))}
                        </div>
                      )}

                      <a href="#" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 22px',
                        background: 'var(--lv-orange-grad)',
                        color: '#fff',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '13px',
                        fontWeight: 600,
                        boxShadow: '0 4px 16px rgba(232,93,42,0.2)',
                      }}>
                        Contact {profile?.full_name?.split(' ')[0] || 'Market Mayor'} →
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
          ARTICLES — Content-heavy editorial grid
          ═══════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(40px, 5vw, 64px) 0', background: 'var(--lv-cream)' }}>
        <div className="lv-container">
          <SectionHeader
            eyebrow={`LIVIN in ${city.name}`}
            eyebrowColor="var(--lv-blue)"
            title={<>City guides & <Em>articles</Em></>}
            subtitle={`Editorial content curated for ${city.name}. Powered by AI, approved by your Market Mayor.`}
          />

          {featuredArticle ? (
            <>
              {/* Featured article — full width */}
              <a href={`/${geoSlug}/${featuredArticle.slug}`} style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '0',
                background: '#fff',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                border: '1px solid var(--lv-border)',
                marginBottom: '16px',
                transition: 'transform 0.25s, box-shadow 0.25s',
              }}>
                <div style={{
                  minHeight: '240px',
                  background: featuredArticle.hero_image_url
                    ? `url(${featuredArticle.hero_image_url}) center/cover`
                    : ARTICLE_GRADS[0],
                }} />
                <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: CAT_COLORS[featuredArticle.content_type] || 'var(--lv-orange)',
                    marginBottom: '8px',
                  }}>
                    {(featuredArticle.category || featuredArticle.content_type || '').replace(/_/g, ' ')}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '26px',
                    color: 'var(--lv-black)',
                    lineHeight: 1.15,
                    marginBottom: '10px',
                  }}>
                    {featuredArticle.title}
                  </div>
                  {featuredArticle.excerpt && (
                    <p style={{
                      fontSize: '14px',
                      fontWeight: 300,
                      color: 'var(--lv-text-muted)',
                      lineHeight: 1.6,
                      marginBottom: '12px',
                    }}>
                      {featuredArticle.excerpt}
                    </p>
                  )}
                  <div style={{ fontSize: '12px', color: 'var(--lv-text-light)' }}>
                    {featuredArticle.word_count ? `${featuredArticle.word_count} words · ` : ''}
                    {featuredArticle.published_at ? new Date(featuredArticle.published_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                  </div>
                </div>
              </a>

              {/* Article grid — 3 columns */}
              {recentArticles.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                }}>
                  {recentArticles.map((article, i) => (
                    <ArticleCard key={article.id} article={article} geoSlug={geoSlug} index={i + 1} />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* No content yet placeholder */
            <div style={{
              padding: '60px 28px',
              textAlign: 'center',
              background: '#fff',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--lv-border)',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '48px',
                color: 'var(--lv-border)',
                marginBottom: '16px',
              }}>
                LIVIN
              </div>
              <p style={{ fontWeight: 600, color: 'var(--lv-black)', marginBottom: '6px' }}>
                Content coming soon for {city.name}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--lv-text-muted)' }}>
                Our AI content pipeline is generating guides and articles for this city.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          MVPs — Local business partners
          ═══════════════════════════════════════════════ */}
      {mvps.length > 0 && (
        <section style={{ padding: 'clamp(40px, 5vw, 64px) 0', background: 'var(--lv-white)' }}>
          <div className="lv-container">
            <SectionHeader
              eyebrow="Local partners"
              eyebrowColor="var(--lv-green)"
              title={<>Trusted businesses in <GreenEm>{city.name}</GreenEm></>}
              subtitle={`LIVIN partners with the best local businesses in ${city.name}. Meet our Market Vendor Partners.`}
            />

            {/* Featured MVPs (premium tier) */}
            {featuredMvps.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: standardMvps.length > 0 ? '16px' : '0',
              }}>
                {featuredMvps.map(mvp => (
                  <MvpCard key={mvp.id} mvp={mvp} featured />
                ))}
              </div>
            )}

            {/* Standard MVPs */}
            {standardMvps.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
              }}>
                {standardMvps.map(mvp => (
                  <MvpCard key={mvp.id} mvp={mvp} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          MORE ARTICLES (if > 7 total)
          ═══════════════════════════════════════════════ */}
      {moreArticles.length > 0 && (
        <section style={{ padding: 'clamp(40px, 5vw, 64px) 0', background: 'var(--lv-cream)' }}>
          <div className="lv-container">
            <SectionHeader
              eyebrow="More stories"
              eyebrowColor="var(--lv-purple)"
              title={<>Keep exploring <Em>{city.name}</Em></>}
              subtitle=""
            />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}>
              {moreArticles.map((article, i) => (
                <ArticleCard key={article.id} article={article} geoSlug={geoSlug} index={i + 7} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          CTA — Become a partner or MM
          ═══════════════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(48px, 6vw, 80px) 0',
        background: 'var(--lv-warm-bg)',
        textAlign: 'center',
      }}>
        <div className="lv-container">
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--lv-orange)', marginBottom: '14px' }}>
            Join LIVIN in {city.name}
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 3.5vw, 36px)',
            color: 'var(--lv-black)',
            lineHeight: 1.15,
            maxWidth: '480px',
            margin: '0 auto 18px',
          }}>
            {marketMayors.length === 0
              ? <>This city needs a <Em>Market Mayor</Em></>
              : <>Be part of the LIVIN <Em>network</Em></>
            }
          </h2>
          <p style={{
            fontSize: '15px',
            fontWeight: 300,
            color: 'var(--lv-text-muted)',
            lineHeight: 1.6,
            maxWidth: '400px',
            margin: '0 auto 28px',
          }}>
            {marketMayors.length === 0
              ? `${city.name} is looking for a licensed real estate professional to lead as Market Mayor. Apply now.`
              : `Promote your business to the LIVIN audience in ${city.name}. Become a Market Vendor Partner.`
            }
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {marketMayors.length === 0 && (
              <a href="#" style={{
                padding: '14px 28px',
                background: 'var(--lv-orange-grad)',
                color: '#fff',
                borderRadius: 'var(--radius-pill)',
                fontSize: '15px',
                fontWeight: 600,
                boxShadow: '0 4px 20px rgba(232,93,42,0.2)',
              }}>
                Apply as Market Mayor →
              </a>
            )}
            <a href="#" style={{
              padding: '14px 28px',
              background: '#fff',
              color: 'var(--lv-black)',
              border: '1px solid var(--lv-border)',
              borderRadius: 'var(--radius-pill)',
              fontSize: '15px',
              fontWeight: 500,
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

// ── Components ──

function SectionHeader({ eyebrow, eyebrowColor, title, subtitle }: {
  eyebrow: string; eyebrowColor: string; title: React.ReactNode; subtitle: string
}) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{
      padding: '18px',
      background: '#fff',
      border: '1px solid var(--lv-border)',
      borderRadius: 'var(--radius)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--lv-text-muted)', marginBottom: '4px', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 600, color: accent ? 'var(--lv-orange)' : 'var(--lv-black)' }}>{value}</div>
    </div>
  )
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
      background: '#fff',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      border: '1px solid var(--lv-border)',
      transition: 'transform 0.25s, box-shadow 0.25s',
    }}>
      <div style={{ height: '140px', background: imgBg }} />
      <div style={{ padding: '16px 18px' }}>
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
  const tierColor = mvp.ad_tier === 'premium' || mvp.ad_tier === 'category_exclusive'
    ? 'var(--lv-orange)' : mvp.ad_tier === 'featured' ? 'var(--lv-blue)' : 'var(--lv-green)'

  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--lv-border)',
      borderRadius: 'var(--radius)',
      padding: featured ? '24px' : '18px',
      transition: 'box-shadow 0.25s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{
            fontFamily: featured ? 'var(--font-display)' : 'var(--font-body)',
            fontSize: featured ? '20px' : '15px',
            fontWeight: featured ? 400 : 600,
            color: 'var(--lv-black)',
            marginBottom: '3px',
          }}>
            {mvp.business_name}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--lv-text-muted)' }}>
            {catLabel}{mvp.business_subcategory ? ` · ${mvp.business_subcategory}` : ''}
          </div>
        </div>
        {(mvp.ad_tier !== 'basic') && (
          <span style={{
            padding: '3px 10px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: tierColor,
            background: tierColor === 'var(--lv-orange)' ? '#FFF5ED' : tierColor === 'var(--lv-blue)' ? '#EFF6FF' : '#ECFDF5',
            border: `1px solid ${tierColor === 'var(--lv-orange)' ? '#FDDCBB' : tierColor === 'var(--lv-blue)' ? '#BFDBFE' : '#A7F3D0'}`,
          }}>
            {mvp.ad_tier === 'category_exclusive' ? 'Exclusive' : mvp.ad_tier}
          </span>
        )}
      </div>

      {mvp.description && (
        <p style={{
          fontSize: '13px',
          fontWeight: 300,
          color: 'var(--lv-text-muted)',
          lineHeight: 1.5,
          marginBottom: '12px',
          display: '-webkit-box',
          WebkitLineClamp: featured ? 3 : 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
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
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '12px',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--lv-orange)',
        }}>
          Visit website →
        </a>
      )}
    </div>
  )
}
