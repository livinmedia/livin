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

type Props = { params: Promise<{ geoSlug: string; contentSlug: string }> }

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
]

// ── Metadata ──
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { geoSlug, contentSlug } = await params
  const { data: article } = await supabase
    .from('content_records')
    .select('title, meta_title, meta_description, excerpt, og_title, og_image_url')
    .eq('slug', contentSlug)
    .eq('status', 'published')
    .single()

  if (!article) return { title: 'Not Found' }
  return {
    title: article.meta_title || article.og_title || article.title,
    description: article.meta_description || article.excerpt || '',
    openGraph: {
      title: article.og_title || article.title,
      description: article.meta_description || article.excerpt || '',
      images: article.og_image_url ? [article.og_image_url] : [],
    },
  }
}

// ── Page ──
export default async function ArticlePage({ params }: Props) {
  const { geoSlug, contentSlug } = await params

  // Fetch the article
  const { data: article } = await supabase
    .from('content_records')
    .select('id, title, slug, excerpt, category, content_type, published_at, word_count, hero_image_url, body_content, body_json, h1, tags, target_keywords, schema_json, author_mm_id, city_id')
    .eq('slug', contentSlug)
    .eq('brand', 'livin')
    .eq('status', 'published')
    .single()

  if (!article) notFound()

  // Fetch city
  const { data: city } = await supabase
    .from('cities')
    .select('id, name, slug, state_region_id')
    .eq('id', article.city_id)
    .single()

  // Fetch state
  let stateName = ''
  let stateAbbr = ''
  if (city?.state_region_id) {
    const { data: state } = await supabase
      .from('states_regions')
      .select('name, abbreviation')
      .eq('id', city.state_region_id)
      .single()
    stateName = state?.name || ''
    stateAbbr = state?.abbreviation?.toUpperCase() || ''
  }

  // Fetch author MM profile
  let mmProfile: { full_name: string; avatar_url: string | null } | null = null
  let mmData: { bio: string | null; specialty_areas: string[]; license_number: string | null; license_state: string | null } | null = null
  if (article.author_mm_id) {
    const { data: mm } = await supabase
      .from('market_mayors')
      .select('bio, specialty_areas, license_number, license_state, user_id')
      .eq('id', article.author_mm_id)
      .single()
    if (mm?.user_id) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url')
        .eq('id', mm.user_id)
        .single()
      mmProfile = profile
      mmData = mm
    }
  }

  // Fetch related articles from same city
  const { data: relatedArticles } = await supabase
    .from('content_records')
    .select('id, title, slug, excerpt, category, content_type, hero_image_url, word_count')
    .eq('city_id', article.city_id)
    .eq('brand', 'livin')
    .eq('status', 'published')
    .neq('id', article.id)
    .order('published_at', { ascending: false })
    .limit(4)

  // Fetch MVPs for sidebar ads
  const { data: mvpAds } = await supabase
    .from('market_vendor_partners')
    .select('id, business_name, business_category, description, website_url, ad_tier')
    .eq('city_id', article.city_id)
    .eq('is_active', true)
    .in('ad_tier', ['premium', 'featured', 'category_exclusive'])
    .limit(2)

  // Parse body content
  const bodyHtml = renderBody(article.body_content, article.body_json)
  const readTime = article.word_count ? Math.max(1, Math.round(article.word_count / 200)) : null
  const catColor = CAT_COLORS[article.content_type] || CAT_COLORS[article.category || ''] || 'var(--lv-orange)'
  const heroImg = article.hero_image_url
    ? `url(${article.hero_image_url}) center/cover`
    : ARTICLE_GRADS[0]
  const publishDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  const cityName = city?.name || 'LIVIN'

  return (
    <>
      {/* JSON-LD structured data */}
      {article.schema_json && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(article.schema_json) }}
        />
      )}

      <Nav />

      {/* ═══════════════════════════════════════════════
          ARTICLE HERO
          ═══════════════════════════════════════════════ */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        padding: 'clamp(32px, 4vw, 48px) 0 0',
        background: 'var(--lv-white)',
      }}>
        <div className="lv-container">
          {/* Breadcrumb */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '20px', fontSize: '13px', color: 'var(--lv-text-muted)',
          }}>
            <a href="/" style={{ color: 'var(--lv-text-muted)' }}>LIVIN</a>
            <span style={{ color: 'var(--lv-text-light)' }}>/</span>
            <a href={`/${geoSlug}`} style={{ color: 'var(--lv-text-muted)' }}>{cityName}{stateAbbr ? `, ${stateAbbr}` : ''}</a>
            <span style={{ color: 'var(--lv-text-light)' }}>/</span>
            <span style={{ color: 'var(--lv-black)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
              {article.title}
            </span>
          </div>

          {/* Category + meta */}
          <div style={{ marginBottom: '12px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: catColor,
            }}>
              {(article.category || article.content_type || '').replace(/_/g, ' ')}
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 44px)',
            color: 'var(--lv-black)', lineHeight: 1.1,
            letterSpacing: '-0.02em', marginBottom: '16px',
            maxWidth: '720px',
          }}>
            {article.h1 || article.title}
          </h1>

          {/* Excerpt */}
          {article.excerpt && (
            <p style={{
              fontSize: '17px', fontWeight: 300,
              color: 'var(--lv-text-muted)', lineHeight: 1.6,
              maxWidth: '640px', marginBottom: '20px',
            }}>
              {article.excerpt}
            </p>
          )}

          {/* Author + date bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            paddingBottom: '24px', borderBottom: '1px solid var(--lv-border)',
            flexWrap: 'wrap',
          }}>
            {mmProfile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF9A5C, #E85D2A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', color: '#fff', fontFamily: 'var(--font-display)',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {mmProfile.avatar_url
                    ? <img src={mmProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : mmProfile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lv-black)' }}>
                    {mmProfile.full_name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--lv-text-muted)' }}>
                    Market Mayor · {cityName}
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--lv-text-muted)' }}>
              {publishDate && <span>{publishDate}</span>}
              {readTime && <span>{readTime} min read</span>}
              {article.word_count && <span>{article.word_count.toLocaleString()} words</span>}
            </div>

            {/* Share buttons */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              {['Share', 'Save'].map(action => (
                <button key={action} style={{
                  padding: '6px 14px', background: '#fff',
                  border: '1px solid var(--lv-border)', borderRadius: 'var(--radius-pill)',
                  fontSize: '12px', fontWeight: 500, color: 'var(--lv-text-muted)',
                  cursor: 'pointer',
                }}>
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HERO IMAGE
          ═══════════════════════════════════════════════ */}
      <div className="lv-container" style={{ paddingTop: '24px' }}>
        <div className="lv-hero-img" style={{
          background: heroImg,
          marginBottom: '32px',
        }} />
      </div>

      {/* ═══════════════════════════════════════════════
          MAIN CONTENT + SIDEBAR
          ═══════════════════════════════════════════════ */}
      <div className="lv-container lv-article-layout" style={{
        paddingBottom: 'clamp(48px, 6vw, 80px)',
      }}>
        {/* ── Main article body ── */}
        <article>
          {/* Article body */}
          <div
            style={{
              fontSize: '16px', fontWeight: 300,
              color: 'var(--lv-black)', lineHeight: 1.8,
            }}
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div style={{
              display: 'flex', gap: '8px', flexWrap: 'wrap',
              marginTop: '32px', paddingTop: '24px',
              borderTop: '1px solid var(--lv-border)',
            }}>
              {article.tags.map((tag: string) => (
                <span key={tag} style={{
                  padding: '5px 14px', background: 'var(--lv-cream)',
                  borderRadius: 'var(--radius-pill)', fontSize: '12px',
                  fontWeight: 500, color: 'var(--lv-text-muted)',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Author card at bottom of article */}
          {mmProfile && (
            <div style={{
              marginTop: '32px', padding: '24px',
              background: 'var(--lv-cream)', borderRadius: 'var(--radius)',
              display: 'flex', gap: '16px', alignItems: 'flex-start',
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF9A5C, #E85D2A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', color: '#fff', fontFamily: 'var(--font-display)',
                flexShrink: 0, overflow: 'hidden',
              }}>
                {mmProfile.avatar_url
                  ? <img src={mmProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : mmProfile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--lv-orange)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  About the author
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--lv-black)', marginBottom: '4px' }}>
                  {mmProfile.full_name}
                </div>
                {mmData?.bio && (
                  <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--lv-text-muted)', lineHeight: 1.5 }}>
                    {mmData.bio}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Related articles — below article body */}
          {relatedArticles && relatedArticles.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: '22px',
                color: 'var(--lv-black)', marginBottom: '16px',
              }}>
                More from {cityName}
              </h3>
              <div className="lv-grid-2">
                {relatedArticles.slice(0, 4).map((rel, i) => (
                  <a key={rel.id} href={`/${geoSlug}/${rel.slug}`} style={{
                    display: 'flex', gap: '14px', alignItems: 'center',
                    padding: '14px', background: '#fff',
                    border: '1px solid var(--lv-border)', borderRadius: 'var(--radius)',
                    transition: 'transform 0.2s',
                  }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '10px', flexShrink: 0,
                      background: rel.hero_image_url ? `url(${rel.hero_image_url}) center/cover` : ARTICLE_GRADS[i % ARTICLE_GRADS.length],
                    }} />
                    <div>
                      <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: CAT_COLORS[rel.content_type] || 'var(--lv-orange)', marginBottom: '3px' }}>
                        {(rel.category || rel.content_type || '').replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--lv-black)', lineHeight: 1.25 }}>
                        {rel.title}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* ── Sidebar ── */}
        <aside style={{ position: 'sticky', top: '80px' }}>

          {/* Sidebar: Ad placement (MVPs) */}
          {mvpAds && mvpAds.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lv-text-light)', marginBottom: '10px' }}>
                Sponsored
              </div>
              {mvpAds.map(mvp => (
                <a key={mvp.id} href={mvp.website_url || '#'} target="_blank" rel="noopener" style={{
                  display: 'block', padding: '16px',
                  background: '#fff', border: '1px solid var(--lv-border)',
                  borderRadius: 'var(--radius)', marginBottom: '10px',
                  transition: 'box-shadow 0.2s',
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lv-black)', marginBottom: '3px' }}>
                    {mvp.business_name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--lv-text-muted)', marginBottom: '6px' }}>
                    {mvp.business_category?.replace(/_/g, ' ')}
                  </div>
                  {mvp.description && (
                    <p style={{ fontSize: '12px', fontWeight: 300, color: 'var(--lv-text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {mvp.description}
                    </p>
                  )}
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--lv-orange)', marginTop: '6px', display: 'inline-block' }}>
                    Learn more →
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* Sidebar: More stories */}
          {relatedArticles && relatedArticles.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lv-text-light)', marginBottom: '12px' }}>
                More from {cityName}
              </div>
              {relatedArticles.slice(0, 3).map((rel, i) => (
                <a key={rel.id} href={`/${geoSlug}/${rel.slug}`} style={{
                  display: 'flex', gap: '12px', alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: i < 2 ? '1px solid var(--lv-border)' : 'none',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '8px', flexShrink: 0,
                    background: rel.hero_image_url ? `url(${rel.hero_image_url}) center/cover` : ARTICLE_GRADS[i % ARTICLE_GRADS.length],
                  }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--lv-black)', lineHeight: 1.25 }}>
                      {rel.title}
                    </div>
                    {rel.word_count && (
                      <div style={{ fontSize: '11px', color: 'var(--lv-text-light)', marginTop: '2px' }}>
                        {Math.max(1, Math.round(rel.word_count / 200))} min read
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Sidebar: MM contact card */}
          {mmProfile && (
            <div style={{
              padding: '20px', background: 'var(--lv-cream)',
              borderRadius: 'var(--radius)', marginBottom: '24px',
            }}>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lv-orange)', marginBottom: '12px' }}>
                Your Market Mayor
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF9A5C, #E85D2A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', color: '#fff', fontFamily: 'var(--font-display)',
                  flexShrink: 0, overflow: 'hidden',
                }}>
                  {mmProfile.avatar_url
                    ? <img src={mmProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : mmProfile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lv-black)' }}>{mmProfile.full_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--lv-text-muted)' }}>Licensed agent · {cityName}</div>
                </div>
              </div>
              <a href="#" style={{
                display: 'block', textAlign: 'center',
                padding: '10px', background: 'var(--lv-orange-grad)',
                color: '#fff', borderRadius: 'var(--radius-pill)',
                fontSize: '13px', fontWeight: 600,
              }}>
                Contact {mmProfile.full_name?.split(' ')[0]} →
              </a>
            </div>
          )}

          {/* Sidebar: Community */}
          <div style={{
            padding: '20px', background: '#fff',
            border: '1px solid var(--lv-border)',
            borderRadius: 'var(--radius)',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lv-text-light)', marginBottom: '12px' }}>
              Community
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lv-black)', marginBottom: '12px' }}>
              Join the conversation
            </div>

            {/* Comment input placeholder */}
            <div style={{
              padding: '10px 14px', background: 'var(--lv-cream)',
              borderRadius: '10px', marginBottom: '14px',
              fontSize: '13px', color: 'var(--lv-text-light)',
            }}>
              Share your thoughts on {cityName}...
            </div>

            {/* Placeholder community posts */}
            {[
              { name: 'Sarah M.', text: 'The Heights has changed so much in the last year. Love seeing the new spots!', time: '2h ago' },
              { name: 'David L.', text: 'Anyone tried the new omakase place on 19th? Worth the drive?', time: '5h ago' },
              { name: 'Maria R.', text: 'Best article on Montrose I have read. The taco rec was spot on.', time: '1d ago' },
            ].map((post, i) => (
              <div key={i} style={{
                padding: '10px 0',
                borderBottom: i < 2 ? '1px solid var(--lv-border)' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--lv-black)' }}>{post.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--lv-text-light)' }}>{post.time}</span>
                </div>
                <p style={{ fontSize: '12px', fontWeight: 300, color: 'var(--lv-text-muted)', lineHeight: 1.4 }}>
                  {post.text}
                </p>
              </div>
            ))}

            <a href="#" style={{
              display: 'block', textAlign: 'center',
              padding: '8px', marginTop: '10px',
              fontSize: '12px', fontWeight: 500, color: 'var(--lv-orange)',
            }}>
              View all comments →
            </a>
          </div>
        </aside>
      </div>

      <Footer />
    </>
  )
}

// ── Render body content from body_content (markdown/html) or body_json ──
function renderBody(bodyContent: string | null, bodyJson: unknown): string {
  // If body_content exists (plain HTML or markdown-ish), use it
  if (bodyContent) {
    // Basic formatting: paragraphs, headings, lists
    return bodyContent
      .split('\n\n')
      .map(block => {
        const trimmed = block.trim()
        if (!trimmed) return ''
        if (trimmed.startsWith('## ')) {
          return `<h2 style="font-family:var(--font-display);font-size:24px;font-weight:400;color:var(--lv-black);margin:32px 0 12px;letter-spacing:-0.01em">${trimmed.slice(3)}</h2>`
        }
        if (trimmed.startsWith('### ')) {
          return `<h3 style="font-family:var(--font-display);font-size:20px;font-weight:400;color:var(--lv-black);margin:24px 0 10px">${trimmed.slice(4)}</h3>`
        }
        return `<p style="margin-bottom:18px">${trimmed}</p>`
      })
      .join('')
  }

  // If body_json exists, render sections
  if (bodyJson && typeof bodyJson === 'object') {
    const json = bodyJson as { sections?: Array<{ heading?: string; body?: string }> }
    if (json.sections && Array.isArray(json.sections)) {
      return json.sections
        .map(section => {
          let html = ''
          if (section.heading) {
            html += `<h2 style="font-family:var(--font-display);font-size:24px;font-weight:400;color:var(--lv-black);margin:32px 0 12px;letter-spacing:-0.01em">${section.heading}</h2>`
          }
          if (section.body) {
            html += `<p style="margin-bottom:18px">${section.body}</p>`
          }
          return html
        })
        .join('')
    }
  }

  // Fallback
  return '<p style="color:var(--lv-text-muted);text-align:center;padding:40px 0">Article content is being generated. Check back soon.</p>'
}
