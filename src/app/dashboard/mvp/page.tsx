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

export default async function MVPDashboard() {
  // For now, default to first Houston MVP. In production, this comes from auth session.
  const { data: mvp } = await supabase
    .from('market_vendor_partners')
    .select('id, business_name, business_category, business_subcategory, description, address, phone, website_url, ad_tier, city_id')
    .eq('is_active', true)
    .limit(1)
    .single()

  if (!mvp) return <div>Partner not found</div>

  const { data: city } = await supabase.from('cities').select('id, name, slug, state_region_id').eq('id', mvp.city_id).single()
  const { data: state } = city?.state_region_id ? await supabase.from('states_regions').select('abbreviation').eq('id', city.state_region_id).single() : { data: null }

  const stateAbbr = state?.abbreviation?.toUpperCase() || ''
  const cityName = city?.name || ''

  // Fetch ad placements for this MVP
  const { data: ads } = await supabase.from('ad_placements').select('id, placement_type, status, price_monthly, performance_data').eq('mvp_id', mvp.id)

  // Fetch other MVPs in city for community
  const { data: otherMvps } = await supabase.from('market_vendor_partners').select('id, business_name, ad_tier').eq('city_id', mvp.city_id).eq('is_active', true).neq('id', mvp.id).limit(5)

  // Get MM for this city
  const { data: mm } = await supabase.from('market_mayors').select('id, user_id, bio').eq('city_id', mvp.city_id).limit(1).single()
  let mmName = 'Market Mayor'
  if (mm?.user_id) {
    const { data: mmProfile } = await supabase.from('user_profiles').select('full_name').eq('id', mm.user_id).single()
    if (mmProfile) mmName = mmProfile.full_name
  }

  const adPlacements = ads || []
  const activeAds = adPlacements.filter(a => a.status === 'active')
  const monthlySpend = activeAds.reduce((sum, a) => sum + (Number(a.price_monthly) || 0), 0)

  // Business health score
  const healthScore = Math.min(100, Math.round(
    (mvp.description ? 15 : 0) +
    (mvp.website_url ? 10 : 0) +
    (mvp.phone ? 10 : 0) +
    (mvp.address ? 10 : 0) +
    (mvp.ad_tier === 'premium' ? 25 : mvp.ad_tier === 'featured' ? 20 : mvp.ad_tier === 'category_exclusive' ? 25 : 10) +
    (activeAds.length > 0 ? 15 : 0) +
    15 // base for being active
  ))

  const healthLabel = healthScore >= 80 ? 'Strong' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Improving' : 'Getting started'

  const catLabels: Record<string, string> = {
    restaurant: 'Restaurant', salon: 'Salon & Beauty', auto_dealer: 'Auto',
    healthcare: 'Healthcare', fitness: 'Fitness', retail: 'Retail',
    services: 'Services', other: 'Business',
  }

  return (
    <DashboardShell role="mvp" cityName={`${cityName}, ${stateAbbr}`} userName={mvp.business_name}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
        <StatCard label="Ad tier" value={mvp.ad_tier === 'category_exclusive' ? 'Exclusive' : mvp.ad_tier.charAt(0).toUpperCase() + mvp.ad_tier.slice(1)} change={catLabels[mvp.business_category] || mvp.business_category} changeColor="#E85D2A" icon="★" iconBg="#FFF5ED" iconColor="#E85D2A" />
        <StatCard label="Active placements" value={activeAds.length} change={activeAds.length > 0 ? 'Running' : 'None yet'} changeColor={activeAds.length > 0 ? '#22C580' : '#999'} icon="◎" iconBg="#ECFDF5" iconColor="#22C580" />
        <StatCard label="Monthly spend" value={monthlySpend > 0 ? `$${monthlySpend}` : '$0'} change={mvp.ad_tier !== 'basic' ? 'Premium tier' : 'Basic tier'} changeColor="#2D7DD2" icon="$" iconBg="#EFF6FF" iconColor="#2D7DD2" />
        <StatCard label="City" value={cityName} change={mm ? `MM: ${mmName}` : 'No MM assigned'} changeColor="#7C3AED" icon="◉" iconBg="#F5F0FF" iconColor="#7C3AED" />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {/* Business health */}
        <DCard title="Business score" subtitle={mvp.business_name}>
          <HealthMeter
            score={healthScore}
            label={healthLabel}
            stats={[
              { value: activeAds.length.toString(), label: 'Placements' },
              { value: mvp.ad_tier === 'category_exclusive' ? 'Excl' : mvp.ad_tier.charAt(0).toUpperCase() + mvp.ad_tier.slice(1), label: 'Tier' },
              { value: cityName.split(' ')[0], label: 'City' },
            ]}
          />
          <LiviMessage text={healthScore < 80 ? `Complete your profile to boost your score. ${!mvp.website_url ? 'Add a website URL. ' : ''}${!mvp.description ? 'Add a description. ' : ''}Consider upgrading to premium for better visibility.` : 'Your profile is strong. Great visibility across the LIVIN network.'} />
        </DCard>

        {/* Business profile */}
        <DCard title="Your listing" subtitle="Edit">
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '18px', fontFamily: "'Libre Caslon Display', serif", color: '#1a1a1a', marginBottom: '4px' }}>{mvp.business_name}</div>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
              {catLabels[mvp.business_category] || mvp.business_category}
              {mvp.business_subcategory ? ` · ${mvp.business_subcategory}` : ''}
            </div>
          </div>
          {mvp.description && <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.5, marginBottom: '12px' }}>{mvp.description}</p>}
          <div style={{ fontSize: '12px', color: '#999', lineHeight: 1.8 }}>
            {mvp.address && <div>{mvp.address}</div>}
            {mvp.phone && <div>{mvp.phone}</div>}
            {mvp.website_url && <div style={{ color: '#E85D2A' }}>{mvp.website_url}</div>}
          </div>
          <div style={{
            marginTop: '12px', padding: '10px 14px', background: '#FFF5ED',
            border: '1px solid #FDDCBB', borderRadius: '10px',
            fontSize: '12px', fontWeight: 500, color: '#93400D', textAlign: 'center', cursor: 'pointer',
          }}>
            Edit listing details
          </div>
        </DCard>

        {/* Ad performance */}
        <DCard title="Ad performance" subtitle={`${activeAds.length} active`}>
          {adPlacements.length > 0 ? adPlacements.map(ad => (
            <div key={ad.id} style={{ padding: '8px 0', borderBottom: '1px solid #F5F3EF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#1a1a1a' }}>{ad.placement_type?.replace(/_/g, ' ')}</span>
                <span style={{
                  fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px',
                  background: ad.status === 'active' ? '#ECFDF5' : '#F5F3EF',
                  color: ad.status === 'active' ? '#22C580' : '#999',
                }}>{ad.status}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>${Number(ad.price_monthly || 0)}/mo</div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px' }}>No ad placements yet</div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>Your listing appears on the {cityName} city page. Upgrade for premium placement.</div>
              <div style={{
                padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE',
                borderRadius: '10px', fontSize: '12px', fontWeight: 500, color: '#1E40AF', cursor: 'pointer',
              }}>
                Explore ad options
              </div>
            </div>
          )}
        </DCard>
      </div>

      {/* Second row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Community */}
        <DCard title={`${cityName} community`} subtitle="Your market">
          {mm && <CommunityPost name={mmName} role="Market Mayor" text={`Welcome to the ${cityName} LIVIN community! Connect with other local partners here.`} time="Pinned" />}
          <CommunityPost name={mvp.business_name} role="MVP" text={`Thrilled to be part of LIVIN in ${cityName}. Looking forward to connecting with the community!`} time="Today" />
          {(otherMvps || []).slice(0, 2).map(other => (
            <CommunityPost key={other.id} name={other.business_name} role="MVP" text={`Welcome! Great to see ${cityName} growing.`} time="Recent" />
          ))}
          <div style={{
            margin: '12px 0 0', padding: '10px 14px', background: '#F5F3EF',
            borderRadius: '10px', fontSize: '12px', color: '#999',
          }}>
            Post an update to your community...
          </div>
        </DCard>

        {/* Other partners in city */}
        <DCard title="Partners in your city" subtitle={`${(otherMvps?.length || 0) + 1} total`}>
          <StatusRow name={mvp.business_name}
            status="You" statusColor="#E85D2A" statusBg="#FFF5ED" />
          {(otherMvps || []).map(other => (
            <StatusRow key={other.id} name={other.business_name}
              status={other.ad_tier === 'basic' ? 'Basic' : other.ad_tier === 'premium' ? 'Premium' : other.ad_tier === 'featured' ? 'Featured' : other.ad_tier}
              statusColor={other.ad_tier === 'premium' ? '#E85D2A' : other.ad_tier === 'featured' ? '#2D7DD2' : '#999'}
              statusBg={other.ad_tier === 'premium' ? '#FFF5ED' : other.ad_tier === 'featured' ? '#EFF6FF' : '#F5F3EF'}
            />
          ))}
          {mm && (
            <div style={{
              marginTop: '12px', padding: '12px', background: '#F5F3EF', borderRadius: '10px',
              display: 'flex', gap: '10px', alignItems: 'center',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF9A5C, #E85D2A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', color: '#fff', fontWeight: 600, flexShrink: 0,
              }}>{mmName.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{mmName}</div>
                <div style={{ fontSize: '11px', color: '#E85D2A' }}>Your Market Mayor</div>
              </div>
            </div>
          )}
        </DCard>
      </div>
    </DashboardShell>
  )
}
