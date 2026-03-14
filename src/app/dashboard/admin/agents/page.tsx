'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { DashboardShell, StatusRow, LiviMessage } from '@/components/DashboardComponents'

export default function AgentsTab() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [agents, setAgents] = useState<any[]>([])

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('user_profiles').select('full_name, role').eq('id', session.user.id).single()
      setProfile(prof)

      const { data } = await supabase.from('agent_configs').select('*').order('build_order')
      setAgents(data || [])
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return <div style={{ fontFamily: "'Outfit',sans-serif", minHeight: '100vh', background: '#F5F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: '14px', color: '#999' }}>Loading agents...</div></div>

  return (
    <DashboardShell role="admin" userName={profile?.full_name || 'Admin'} activeTab="Agents">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontFamily: "'Libre Caslon Display', serif", fontSize: '22px', color: '#1a1a1a' }}>LIVI agents ({agents.length})</h2>
      </div>

      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #EEEAE4', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 18px', borderBottom: '1px solid #EEEAE4', fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <span>Agent</span><span>Brand scope</span><span>Phase</span><span>Trigger</span><span>Permission</span><span>Status</span>
        </div>
        {agents.map(a => (
          <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', padding: '10px 18px', borderBottom: '1px solid #F5F3EF', alignItems: 'center', fontSize: '13px' }}>
            <div>
              <span style={{ fontWeight: 500, color: '#1a1a1a' }}>{a.display_name || a.agent_name.replace(/_/g, ' ')}</span>
              <div style={{ fontSize: '10px', color: '#ccc' }}>Build order: {a.build_order}</div>
            </div>
            <span style={{ color: '#999', fontSize: '12px' }}>{a.brand_scope}</span>
            <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px', background: a.phase === 'phase_1' ? '#FFF5ED' : a.phase === 'phase_2' ? '#EFF6FF' : '#F5F0FF', color: a.phase === 'phase_1' ? '#E85D2A' : a.phase === 'phase_2' ? '#2D7DD2' : '#7C3AED', display: 'inline-block', width: 'fit-content' }}>
              {a.phase?.replace('_', ' ')}
            </span>
            <span style={{ color: '#999', fontSize: '12px' }}>{a.trigger_type}</span>
            <span style={{ color: '#999', fontSize: '11px' }}>{(a.permission_level || '').replace(/_/g, ' ')}</span>
            <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px', background: a.is_active ? '#ECFDF5' : '#F5F3EF', color: a.is_active ? '#22C580' : '#999', display: 'inline-block', width: 'fit-content' }}>
              {a.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>
      <LiviMessage text={`${agents.filter(a => a.is_active).length} agents active out of ${agents.length}. Phase 1 agents are priority for activation. Activate agents from the Supabase dashboard by setting is_active = true.`} />
    </DashboardShell>
  )
}
