'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { DashboardShell, StatusRow, LiviMessage } from '@/components/DashboardComponents'

export default function PartnersTab() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [mvps, setMvps] = useState<any[]>([])
  const [cities, setCities] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('user_profiles').select('full_name, role').eq('id', session.user.id).single()
      setProfile(prof)

      const [mvpsRes, citiesRes] = await Promise.all([
        supabase.from('market_vendor_partners').select('id, business_name, business_category, business_subcategory, ad_tier, city_id, is_active, address, phone, website_url, description').order('created_at', { ascending: false }),
        supabase.from('cities').select('id, name').eq('is_active', true),
      ])
      setMvps(mvpsRes.data || [])
      setCities(new Map((citiesRes.data || []).map(c => [c.id, c])))
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return <div style={{ fontFamily: "'Outfit',sans-serif", minHeight: '100vh', background: '#F5F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: '14px', color: '#999' }}>Loading partners...</div></div>

  const tierColors: Record<string, { bg: string; color: string }> = {
    premium: { bg: '#FFF5ED', color: '#E85D2A' }, category_exclusive: { bg: '#FFF5ED', color: '#E85D2A' },
    featured: { bg: '#EFF6FF', color: '#2D7DD2' }, basic: { bg: '#F5F3EF', color: '#999' },
  }

  return (
    <DashboardShell role="admin" userName={profile?.full_name || 'Admin'} activeTab="Partners">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontFamily: "'Libre Caslon Display', serif", fontSize: '22px', color: '#1a1a1a' }}>Partners ({mvps.length})</h2>
      </div>

      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #EEEAE4', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 18px', borderBottom: '1px solid #EEEAE4', fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <span>Business</span><span>Category</span><span>City</span><span>Tier</span><span>Status</span>
        </div>
        {mvps.map(mvp => {
          const city = cities.get(mvp.city_id)
          const tc = tierColors[mvp.ad_tier] || tierColors.basic
          return (
            <div key={mvp.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '10px 18px', borderBottom: '1px solid #F5F3EF', alignItems: 'center', fontSize: '13px' }}>
              <div>
                <span style={{ fontWeight: 500, color: '#1a1a1a' }}>{mvp.business_name}</span>
                {mvp.phone && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#ccc' }}>{mvp.phone}</span>}
              </div>
              <span style={{ color: '#999', fontSize: '12px' }}>{(mvp.business_category || '').replace(/_/g, ' ')}</span>
              <span style={{ color: '#999', fontSize: '12px' }}>{city?.name || '—'}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px', background: tc.bg, color: tc.color, display: 'inline-block', width: 'fit-content' }}>
                {mvp.ad_tier === 'category_exclusive' ? 'Exclusive' : mvp.ad_tier}
              </span>
              <span style={{ fontSize: '11px', color: mvp.is_active ? '#22C580' : '#999' }}>{mvp.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          )
        })}
      </div>
      <LiviMessage text={`${mvps.length} partners across ${new Set(mvps.map(m => m.city_id)).size} cities. ${mvps.filter(m => m.ad_tier !== 'basic').length} at premium tiers.`} />
    </DashboardShell>
  )
}
