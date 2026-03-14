import { createClient } from '@supabase/supabase-js'
import {
  DashboardShell, StatCard, DCard, HealthMeter, LeadRow, ActivityRow,
  StatusRow, LiviMessage, CommunityPost, QuickAction
} from '@/components/DashboardComponents'

export const revalidate = 300

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function MMDashboard() {
  // For now, default to Houston pilot. In production, this comes from auth session.
  const { data: mmCity } = await supabase
    .from('cities')
    .select('id, name, slug, population, has_market_mayor, content_status, state_region_id')
    .eq('slug', 'houston-texas')
    .single()

  if (!mmCity) return <div>City not found</div>

  const { data: state } = await supabase
    .from('states_regions')
    .select('abbreviation')
    .eq('id', mmCity.state_region_id)
    .single()

  const stateAbbr = state?.abbreviation?.toUpperCase() || ''

  const [contentRes, leadsRes, mvpsRes, mmRes] = await Promise.all([
    supabase.from('content_records').select('id, title, slug, status, content_type, category, published_at, word_count, hero_image_url').eq('city_id', mmCity.id).eq('brand', 'livin').order('created_at', { ascending: false }).limit(15),
    supabase.from('leads').select('id, contact_name, contact_email, contact_phone, lead_type, status, quality_score, created_at').eq('city_id', mmCity.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('market_vendor_partners').select('id, business_name, business_category, ad_tier, description, is_active').eq('city_id', mmCity.id).eq('is_active', true),
    supabase.from('market_mayors').select('id, bio, specialty_areas, license_number, user_id').eq('city_id', mmCity.id).limit(1),
  ])

  const content = contentRes.data || []
  const leads = leadsRes.data || []
  const mvps = mvpsRes.data || []
  const mm = mmRes.data?.[0]

  const published = content.filter(c => c.status === 'published')
  const pendingReview = content.filter(c => c.status === 'awaiting_approval')
  const newLeads = leads.filter(l => l.status === 'new')

  // City health score
  const healthScore = Math.min(100, Math.round(
    (published.length > 0 ? 30 : 0) +
    (published.length >= 10 ? 15 : published.length * 1.5) +
    (mvps.length > 0 ? 15 : 0) +
    (mvps.length >= 3 ? 10 : mvps.length * 3.3) +
    (leads.length > 0 ? 15 : 0) +
    (mm ? 15 : 0)
  ))

  const healthLabel = healthScore >= 80 ? 'Thriving' : healthScore >= 60 ? 'Growing' : healthScore >= 40 ? 'Building' : 'Getting started'

  // Get MM profile name
  let mmName = 'Market Mayor'
  if (mm?.user_id) {
    const { data: profile } = await supabase.from('user_profiles').select('full_name').eq('id', mm.user_id).single()
    if (profile) mmName = profile.full_name
  }

  return (
    <DashboardShell role="mm" cityName={`${mmCity.name}, ${stateAbbr}`} userName={mmName}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
        <StatCard label="Published articles" value={published.length} change={pendingReview.length > 0 ? `${pendingReview.length} awaiting review` : 'All caught up'} changeColor={pendingReview.length > 0 ? '#E85D2A' : '#22C580'} icon="✎" iconBg="#ECFDF5" iconColor="#22C580" />
        <StatCard label="New leads" value={newLeads.length} change={`${leads.length} total`} changeColor="#2D7DD2" icon="♥" iconBg="#EFF6FF" iconColor="#2D7DD2" />
        <StatCard label="Local partners" value={mvps.length} change={mvps.filter(m => m.ad_tier === 'premium' || m.ad_tier === 'featured').length + ' premium'} changeColor="#E85D2A" icon="⊕" iconBg="#FFF5ED" iconColor="#E85D2A" />
        <StatCard label="Population" value={mmCity.population ? mmCity.population.toLocaleString() : '—'} change={mmCity.content_status || 'active'} changeColor="#7C3AED" icon="◉" iconBg="#F5F0FF" iconColor="#7C3AED" />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {/* City health */}
        <DCard title="City health score" subtitle={mmCity.name}>
          <HealthMeter
            score={healthScore}
            label={healthLabel}
            stats={[
              { value: published.length.toString(), label: 'Articles' },
              { value: mvps.length.toString(), label: 'Partners' },
              { value: leads.length.toString(), label: 'Leads' },
            ]}
          />
        </DCard>

        {/* Leads */}
        <DCard title="Your leads" subtitle="View all">
          {leads.length > 0 ? leads.slice(0, 5).map(lead => {
            const colors = { new: { bg: '#EFF6FF', color: '#2D7DD2', av: '#2D7DD2' }, qualified: { bg: '#ECFDF5', color: '#22C580', av: '#22C580' }, routed: { bg: '#FFF5ED', color: '#E85D2A', av: '#E85D2A' }, contacted: { bg: '#F5F0FF', color: '#7C3AED', av: '#7C3AED' }, converted: { bg: '#ECFDF5', color: '#22C580', av: '#22C580' }, lost: { bg: '#F5F3EF', color: '#999', av: '#999' } }
            const c = colors[lead.status as keyof typeof colors] || colors.new
            return (
              <LeadRow key={lead.id} name={lead.contact_name || 'Anonymous'} type={lead.lead_type?.replace(/_/g, ' ') || 'General'}
                status={lead.status} statusColor={c.color} statusBg={c.bg} avatarColor={c.av} />
            )
          }) : (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '13px', color: '#999' }}>
              No leads yet. As content publishes, leads will flow in.
            </div>
          )}
          <LiviMessage text={`${newLeads.length} new leads need follow up. Average quality score: ${leads.length > 0 ? (leads.reduce((sum, l) => sum + (Number(l.quality_score) || 0), 0) / leads.length).toFixed(1) : '—'}.`} />
        </DCard>

        {/* Content to review */}
        <DCard title="Content to review" subtitle={`${pendingReview.length} pending`}>
          {pendingReview.length > 0 ? pendingReview.map(c => (
            <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid #F5F3EF' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a', marginBottom: '2px' }}>{c.title}</div>
              <div style={{ fontSize: '11px', color: '#999' }}>{c.content_type?.replace(/_/g, ' ')} · {c.word_count ? `${c.word_count} words` : 'Draft'}</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <span style={{ padding: '4px 12px', background: '#ECFDF5', color: '#22C580', borderRadius: '100px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Approve</span>
                <span style={{ padding: '4px 12px', background: '#FFF5ED', color: '#E85D2A', borderRadius: '100px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Request edit</span>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '13px', color: '#22C580', fontWeight: 500 }}>
              All content reviewed. You are caught up!
            </div>
          )}
          {published.length > 0 && (
            <>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#999', marginTop: '12px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recently published</div>
              {published.slice(0, 3).map(c => (
                <div key={c.id} style={{ padding: '5px 0', borderBottom: '1px solid #F5F3EF' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#1a1a1a' }}>{c.title}</div>
                  <div style={{ fontSize: '10px', color: '#999' }}>{c.published_at ? new Date(c.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</div>
                </div>
              ))}
            </>
          )}
        </DCard>
      </div>

      {/* Second row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Local partners */}
        <DCard title="Your local partners" subtitle={`${mvps.length} active`}>
          {mvps.map(mvp => (
            <StatusRow key={mvp.id} name={mvp.business_name}
              status={mvp.ad_tier === 'basic' ? 'Basic' : mvp.ad_tier === 'premium' ? 'Premium' : mvp.ad_tier === 'featured' ? 'Featured' : mvp.ad_tier === 'category_exclusive' ? 'Exclusive' : mvp.ad_tier}
              statusColor={mvp.ad_tier === 'premium' || mvp.ad_tier === 'category_exclusive' ? '#E85D2A' : mvp.ad_tier === 'featured' ? '#2D7DD2' : '#999'}
              statusBg={mvp.ad_tier === 'premium' || mvp.ad_tier === 'category_exclusive' ? '#FFF5ED' : mvp.ad_tier === 'featured' ? '#EFF6FF' : '#F5F3EF'}
            />
          ))}
          {mvps.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '13px', color: '#999' }}>No partners yet. Recruit local businesses to grow your network.</div>
          )}
          <LiviMessage text={`${mvps.length} partners in ${mmCity.name}. ${mvps.filter(m => m.ad_tier !== 'basic').length} at premium tiers.`} />
        </DCard>

        {/* City community */}
        <DCard title={`${mmCity.name} community`} subtitle="Your market">
          <CommunityPost name={mmName} role="Market Mayor" text={`Welcome to the ${mmCity.name} LIVIN community! This is where our local partners connect and collaborate.`} time="Pinned" />
          {mvps.slice(0, 2).map(mvp => (
            <CommunityPost key={mvp.id} name={mvp.business_name} role="MVP" text={`Excited to be a ${mvp.ad_tier} partner in ${mmCity.name}!`} time="Recent" />
          ))}
          <div style={{
            margin: '12px 0 0', padding: '10px 14px', background: '#F5F3EF',
            borderRadius: '10px', fontSize: '12px', color: '#999',
          }}>
            Post an update to your community...
          </div>
        </DCard>
      </div>
    </DashboardShell>
  )
}
