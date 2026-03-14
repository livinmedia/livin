'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { DashboardShell, LeadRow, LiviMessage } from '@/components/DashboardComponents'

export default function LeadsTab() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [leads, setLeads] = useState<any[]>([])
  const [cities, setCities] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('user_profiles').select('full_name, role').eq('id', session.user.id).single()
      setProfile(prof)

      const [leadsRes, citiesRes] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('cities').select('id, name').eq('is_active', true),
      ])
      setLeads(leadsRes.data || [])
      setCities(new Map((citiesRes.data || []).map(c => [c.id, c])))
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return <div style={{ fontFamily: "'Outfit',sans-serif", minHeight: '100vh', background: '#F5F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: '14px', color: '#999' }}>Loading leads...</div></div>

  const colors: Record<string, any> = {
    new: { bg: '#EFF6FF', color: '#2D7DD2', av: '#2D7DD2' },
    qualified: { bg: '#ECFDF5', color: '#22C580', av: '#22C580' },
    routed: { bg: '#FFF5ED', color: '#E85D2A', av: '#E85D2A' },
    contacted: { bg: '#F5F0FF', color: '#7C3AED', av: '#7C3AED' },
    converted: { bg: '#ECFDF5', color: '#22C580', av: '#22C580' },
    lost: { bg: '#F5F3EF', color: '#999', av: '#999' },
  }

  return (
    <DashboardShell role="admin" userName={profile?.full_name || 'Admin'} activeTab="Leads">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontFamily: "'Libre Caslon Display', serif", fontSize: '22px', color: '#1a1a1a' }}>Leads ({leads.length})</h2>
      </div>

      {leads.length > 0 ? (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #EEEAE4', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 18px', borderBottom: '1px solid #EEEAE4', fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>Name</span><span>Email</span><span>Type</span><span>City</span><span>Quality</span><span>Status</span>
          </div>
          {leads.map(lead => {
            const city = cities.get(lead.city_id)
            const c = colors[lead.status] || colors.new
            return (
              <div key={lead.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '10px 18px', borderBottom: '1px solid #F5F3EF', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ fontWeight: 500, color: '#1a1a1a' }}>{lead.contact_name || 'Anonymous'}</span>
                <span style={{ color: '#999', fontSize: '12px' }}>{lead.contact_email || '—'}</span>
                <span style={{ color: '#999', fontSize: '12px' }}>{(lead.lead_type || '').replace(/_/g, ' ')}</span>
                <span style={{ color: '#999', fontSize: '12px' }}>{city?.name || '—'}</span>
                <span style={{ color: lead.quality_score >= 7 ? '#22C580' : lead.quality_score >= 4 ? '#E85D2A' : '#999', fontWeight: 600, fontSize: '12px' }}>{lead.quality_score || '—'}</span>
                <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px', background: c.bg, color: c.color, display: 'inline-block', width: 'fit-content' }}>{lead.status}</span>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #EEEAE4', padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#1a1a1a', marginBottom: '8px' }}>No leads yet</div>
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '16px' }}>Lead capture forms are live on city pages. As traffic grows, leads will appear here.</div>
          <LiviMessage text="The lead routing agent (Agent 05) will automatically score and route leads to Market Mayors once they start flowing in." />
        </div>
      )}
    </DashboardShell>
  )
}
