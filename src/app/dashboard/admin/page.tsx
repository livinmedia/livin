'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'
import {
  DashboardShell, StatCard, DCard, HealthMeter, LeadRow, ActivityRow,
  StatusRow, LiviMessage, CommunityPost, QuickAction
} from '@/components/DashboardComponents'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function init() {
      // Check auth session
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      setUser(session.user)

      // Get profile
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(prof)

      // Check role — only admin/super_admin
      if (prof && prof.role !== 'super_admin' && prof.role !== 'admin') {
        if (prof.role === 'market_mayor') {
          window.location.href = '/dashboard/mm'
        } else if (prof.role === 'mvp') {
          window.location.href = '/dashboard/mvp'
        }
        return
      }

      // Fetch all dashboard data in parallel
      const [citiesRes, contentRes, leadsRes, mmsRes, mvpsRes, agentsRes] = await Promise.all([
        supabase.from('cities').select('id, name, slug, population, is_active, has_market_mayor, content_status').eq('is_active', true).order('name'),
        supabase.from('content_records').select('id, title, slug, status, content_type, city_id, published_at, created_at, category').eq('brand', 'livin').order('created_at', { ascending: false }).limit(20),
        supabase.from('leads').select('id, contact_name, contact_email, lead_type, status, quality_score, city_id, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('market_mayors').select('id, user_id, city_id, onboarding_status, bio').order('created_at', { ascending: false }),
        supabase.from('market_vendor_partners').select('id, business_name, business_category, ad_tier, city_id, is_active').eq('is_active', true),
        supabase.from('agent_configs').select('id, agent_name, display_name, is_active, phase').order('build_order'),
      ])

      const cities = citiesRes.data || []
      const content = contentRes.data || []
      const leads = leadsRes.data || []
      const mms = mmsRes.data || []
      const mvps = mvpsRes.data || []
      const agents = agentsRes.data || []

      setData({ cities, content, leads, mms, mvps, agents })
      setLoading(false)
    }

    init()
  }, [])

  if (loading) {
    return (
      <div style={{
        fontFamily: "'Outfit', sans-serif", minHeight: '100vh', background: '#F5F3EF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Libre Caslon Display', serif", fontSize: '32px', color: '#1a1a1a', marginBottom: '8px' }}>LIVIN</div>
          <div style={{ fontSize: '14px', color: '#999' }}>Loading admin panel...</div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { cities, content, leads, mms, mvps, agents } = data
  const cityMap: Map<string, any> = new Map(cities.map((c: any) => [c.id, c]))

  const publishedCount = content.filter((c: any) => c.status === 'published').length
  const queueCount = content.filter((c: any) => c.status !== 'published' && c.status !== 'archived').length
  const newLeads = leads.filter((l: any) => l.status === 'new').length
  const citiesWithMM = cities.filter((c: any) => c.has_market_mayor).length
  const activeAgents = agents.filter((a: any) => a.is_active).length

  const healthScore = Math.min(100, Math.round(
    (citiesWithMM / Math.max(cities.length, 1)) * 100 +
    (publishedCount > 0 ? 40 : 0) +
    (leads.length > 0 ? 20 : 0)
  ))

  return (
    <DashboardShell role="admin" userName={profile?.full_name || 'Admin'} activeTab="Overview">
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '18px' }}>
        <StatCard label="Active cities" value={cities.length} change={`${citiesWithMM} with MMs`} changeColor="#E85D2A" icon="★" iconBg="#FFF5ED" iconColor="#E85D2A" />
        <StatCard label="Published" value={publishedCount} change={`${queueCount} in pipeline`} changeColor="#22C580" icon="✎" iconBg="#ECFDF5" iconColor="#22C580" />
        <StatCard label="New leads" value={newLeads} change={`${leads.length} total`} changeColor="#2D7DD2" icon="♥" iconBg="#EFF6FF" iconColor="#2D7DD2" />
        <StatCard label="Market Mayors" value={mms.length} change={`${cities.length - citiesWithMM} cities open`} changeColor="#7C3AED" icon="⊕" iconBg="#F5F0FF" iconColor="#7C3AED" />
        <StatCard label="LIVI agents" value={`${activeAgents}/${agents.length}`} change={activeAgents > 0 ? 'Running' : 'Standby'} changeColor={activeAgents > 0 ? '#22C580' : '#E85D2A'} icon="◎" iconBg="#FFF5ED" iconColor="#E85D2A" />
      </div>

      {/* Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <DCard title="Network health" subtitle={`${cities.length} cities`}>
          <HealthMeter
            score={healthScore}
            label={healthScore >= 60 ? 'Healthy' : 'Growing'}
            stats={[
              { value: cities.length.toString(), label: 'Cities' },
              { value: mvps.length.toString(), label: 'Partners' },
              { value: publishedCount.toString(), label: 'Articles' },
            ]}
          />
        </DCard>

        <DCard title="Recent leads" subtitle="View all">
          {leads.length > 0 ? leads.slice(0, 5).map((lead: any) => {
            const city = cityMap.get(lead.city_id)
            const colors: Record<string, any> = {
              new: { bg: '#EFF6FF', color: '#2D7DD2', av: '#2D7DD2' },
              qualified: { bg: '#ECFDF5', color: '#22C580', av: '#22C580' },
              routed: { bg: '#FFF5ED', color: '#E85D2A', av: '#E85D2A' },
              contacted: { bg: '#F5F0FF', color: '#7C3AED', av: '#7C3AED' },
              converted: { bg: '#ECFDF5', color: '#22C580', av: '#22C580' },
              lost: { bg: '#F5F3EF', color: '#999', av: '#999' },
            }
            const c = colors[lead.status] || colors.new
            return (
              <LeadRow key={lead.id} name={lead.contact_name || 'Anonymous'}
                type={`${(lead.lead_type || '').replace(/_/g, ' ')} · ${city?.name || ''}`}
                status={lead.status} statusColor={c.color} statusBg={c.bg} avatarColor={c.av}
              />
            )
          }) : (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '13px', color: '#999' }}>
              No leads yet. Pipeline ready.
              <LiviMessage text="Lead capture forms are live on city pages. As traffic grows, leads will appear here automatically." />
            </div>
          )}
        </DCard>

        <DCard title="Activity log" subtitle="Live">
          {content.slice(0, 4).map((c: any) => {
            const city = cityMap.get(c.city_id)
            return (
              <ActivityRow key={c.id}
                text={`${c.status === 'published' ? 'Published' : c.status.replace(/_/g, ' ')}: "${c.title}"`}
                time={c.published_at ? new Date(c.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Pending'}
                dotColor={c.status === 'published' ? '#22C580' : c.status === 'awaiting_approval' ? '#E85D2A' : '#2D7DD2'}
              />
            )
          })}
          {mms.slice(0, 1).map((mm: any) => (
            <ActivityRow key={mm.id} text={`Market Mayor onboarded (${mm.onboarding_status})`} time="Active" dotColor="#7C3AED" />
          ))}
          {mvps.slice(0, 2).map((mvp: any) => (
            <ActivityRow key={mvp.id} text={`Partner added: ${mvp.business_name}`} time={mvp.ad_tier} dotColor="#E85D2A" />
          ))}
          <LiviMessage text={`${agents.length} agents configured. ${activeAgents} active. Content pipeline operational.`} />
        </DCard>
      </div>

      {/* Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <DCard title="Content pipeline" subtitle={`${content.length} total`}>
          {content.slice(0, 8).map((c: any) => {
            const city = cityMap.get(c.city_id)
            const statusColors: Record<string, { bg: string; color: string }> = {
              published: { bg: '#ECFDF5', color: '#22C580' },
              awaiting_approval: { bg: '#FFF5ED', color: '#E85D2A' },
              mm_approved: { bg: '#EFF6FF', color: '#2D7DD2' },
              seo_optimized: { bg: '#F5F0FF', color: '#7C3AED' },
              generating: { bg: '#EFF6FF', color: '#2D7DD2' },
              queued: { bg: '#F5F3EF', color: '#999' },
            }
            const sc = statusColors[c.status] || statusColors.queued
            return (
              <div key={c.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0', borderBottom: '1px solid #F5F3EF',
              }}>
                <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                  <div style={{ fontSize: '10px', color: '#999' }}>{city?.name || ''} · {c.content_type}</div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px', background: sc.bg, color: sc.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {c.status.replace(/_/g, ' ')}
                </span>
              </div>
            )
          })}
          <LiviMessage text={`${queueCount} articles in pipeline. ${publishedCount} published across ${new Set(content.filter((c: any) => c.status === 'published').map((c: any) => c.city_id)).size} cities.`} />
        </DCard>

        <DCard title="LIVI agents" subtitle={`${agents.length} total`}>
          {agents.map((a: any) => (
            <StatusRow key={a.id}
              name={a.display_name || a.agent_name.replace(/_/g, ' ')}
              status={a.is_active ? 'Active' : a.phase === 'phase_1' ? 'Standby' : 'Idle'}
              statusColor={a.is_active ? '#22C580' : a.phase === 'phase_1' ? '#E85D2A' : '#999'}
              statusBg={a.is_active ? '#ECFDF5' : a.phase === 'phase_1' ? '#FFF5ED' : '#F5F3EF'}
            />
          ))}
          <LiviMessage text={`${activeAgents} agents active, ${agents.filter((a: any) => a.phase === 'phase_1').length} Phase 1, ${agents.filter((a: any) => a.phase === 'phase_2').length} Phase 2. All agents reporting normal.`} />
        </DCard>
      </div>

      {/* Row 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <DCard title="Integrations" subtitle="Settings">
          <StatusRow name="Supabase" status="Connected" statusColor="#22C580" statusBg="#ECFDF5" />
          <StatusRow name="OpenRouter / DeepSeek" status="Connected" statusColor="#22C580" statusBg="#ECFDF5" />
          <StatusRow name="Anthropic / Claude" status="Connected" statusColor="#22C580" statusBg="#ECFDF5" />
          <StatusRow name="Vercel" status="Connected" statusColor="#22C580" statusBg="#ECFDF5" />
          <StatusRow name="Resend" status="Setup today" statusColor="#E85D2A" statusBg="#FFF5ED" />
          <StatusRow name="Plivo SMS" status="Pending" statusColor="#E85D2A" statusBg="#FFF5ED" />
          <StatusRow name="Google Analytics" status="Not set up" statusColor="#999" statusBg="#F5F3EF" />
        </DCard>

        <DCard title="Communities" subtitle="All cities">
          <CommunityPost name="Marcus Williams" role="Market Mayor" text="Welcome to the Houston LIVIN community!" time="Today" replies={2} />
          {mvps.slice(0, 2).map((mvp: any) => (
            <CommunityPost key={mvp.id} name={mvp.business_name} role="MVP" text={`Excited to be a ${mvp.ad_tier} partner!`} time="Recent" />
          ))}
          <div style={{
            margin: '12px 0 0', padding: '10px 14px', background: '#F5F3EF',
            borderRadius: '10px', fontSize: '12px', color: '#999',
          }}>
            Post an update across all communities...
          </div>
        </DCard>

        <DCard title="Quick actions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <QuickAction label="Generate new content" bg="#FFF5ED" border="#FDDCBB" color="#93400D" />
            <QuickAction label="Review pending articles" bg="#EFF6FF" border="#BFDBFE" color="#1E40AF" />
            <QuickAction label="Add Market Mayor" bg="#F5F0FF" border="#DDD6FE" color="#5B21B6" />
            <QuickAction label="Add local partner" bg="#ECFDF5" border="#A7F3D0" color="#065F46" />
            <QuickAction label="Setup Resend email" bg="#FFF5ED" border="#FDDCBB" color="#93400D" />
            <QuickAction label="Ask LIVI anything" bg="#fff" border="#EEEAE4" color="#E85D2A" />
          </div>
        </DCard>
      </div>

      {/* Logout */}
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
          style={{
            padding: '8px 20px', background: '#fff', border: '1px solid #EEEAE4',
            borderRadius: '100px', fontSize: '12px', color: '#999', cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </DashboardShell>
  )
}
