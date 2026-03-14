'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { DashboardShell, StatusRow, LiviMessage, QuickAction } from '@/components/DashboardComponents'

export default function SettingsTab() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [integrations, setIntegrations] = useState<any[]>([])

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('user_profiles').select('full_name, role').eq('id', session.user.id).single()
      setProfile(prof)

      const { data } = await supabase.from('api_integrations').select('*').order('service_name')
      setIntegrations(data || [])
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return <div style={{ fontFamily: "'Outfit',sans-serif", minHeight: '100vh', background: '#F5F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: '14px', color: '#999' }}>Loading settings...</div></div>

  const statusColors: Record<string, { bg: string; color: string }> = {
    active: { bg: '#ECFDF5', color: '#22C580' }, open: { bg: '#F5F3EF', color: '#999' },
    pending: { bg: '#FFF5ED', color: '#E85D2A' }, research: { bg: '#EFF6FF', color: '#2D7DD2' },
    integration: { bg: '#F5F0FF', color: '#7C3AED' }, disabled: { bg: '#F5F3EF', color: '#999' },
    deprecated: { bg: '#F5F3EF', color: '#ccc' },
  }

  return (
    <DashboardShell role="admin" userName={profile?.full_name || 'Admin'} activeTab="Settings">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Integrations */}
        <div>
          <h2 style={{ fontFamily: "'Libre Caslon Display', serif", fontSize: '22px', color: '#1a1a1a', marginBottom: '16px' }}>API integrations ({integrations.length})</h2>
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #EEEAE4', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '12px 18px', borderBottom: '1px solid #EEEAE4', fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <span>Service</span><span>Category</span><span>Status</span>
            </div>
            {integrations.map(api => {
              const sc = statusColors[api.status] || statusColors.open
              return (
                <div key={api.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '10px 18px', borderBottom: '1px solid #F5F3EF', alignItems: 'center', fontSize: '13px' }}>
                  <div>
                    <span style={{ fontWeight: 500, color: '#1a1a1a' }}>{api.display_name || api.service_name}</span>
                    {api.api_key_env_var && <div style={{ fontSize: '10px', color: '#ccc', fontFamily: 'monospace' }}>{api.api_key_env_var}</div>}
                  </div>
                  <span style={{ color: '#999', fontSize: '12px' }}>{api.category}</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px', background: sc.bg, color: sc.color, display: 'inline-block', width: 'fit-content' }}>{api.status}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* System info */}
        <div>
          <h2 style={{ fontFamily: "'Libre Caslon Display', serif", fontSize: '22px', color: '#1a1a1a', marginBottom: '16px' }}>System</h2>
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #EEEAE4', padding: '18px' }}>
            <StatusRow name="Supabase" status="Connected" statusColor="#22C580" statusBg="#ECFDF5" />
            <StatusRow name="Vercel" status="Connected" statusColor="#22C580" statusBg="#ECFDF5" />
            <StatusRow name="OpenRouter / DeepSeek" status="Connected" statusColor="#22C580" statusBg="#ECFDF5" />
            <StatusRow name="Anthropic / Claude" status="Connected" statusColor="#22C580" statusBg="#ECFDF5" />
            <StatusRow name="Resend email" status="Setup today" statusColor="#E85D2A" statusBg="#FFF5ED" />
            <StatusRow name="Plivo SMS" status="Pending" statusColor="#E85D2A" statusBg="#FFF5ED" />
            <StatusRow name="Google Analytics" status="Not set up" statusColor="#999" statusBg="#F5F3EF" />

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #EEEAE4' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#999', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Environment</div>
              <div style={{ fontSize: '12px', color: '#999', lineHeight: 2 }}>
                <div>Platform: <span style={{ color: '#1a1a1a', fontFamily: 'monospace' }}>livin-chi.vercel.app</span></div>
                <div>Database: <span style={{ color: '#1a1a1a', fontFamily: 'monospace' }}>bmemtekrchzoxpwtaufd</span></div>
                <div>Framework: <span style={{ color: '#1a1a1a' }}>Next.js 16.1.6</span></div>
                <div>User: <span style={{ color: '#1a1a1a' }}>{profile?.full_name} ({profile?.role})</span></div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '10px' }}>Quick actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <QuickAction label="Setup Resend email" bg="#FFF5ED" border="#FDDCBB" color="#93400D" />
              <QuickAction label="Configure Google Analytics" bg="#EFF6FF" border="#BFDBFE" color="#1E40AF" />
              <QuickAction label="Start Plivo registration" bg="#F5F0FF" border="#DDD6FE" color="#5B21B6" />
            </div>
          </div>

          <LiviMessage text="Resend email is the next integration to set up. It enables MM notifications, lead routing alerts, and welcome emails." />
        </div>
      </div>
    </DashboardShell>
  )
}
