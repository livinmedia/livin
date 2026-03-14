'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { DashboardShell, LiviMessage } from '@/components/DashboardComponents'

export default function ContentTab() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [content, setContent] = useState<any[]>([])
  const [cities, setCities] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('user_profiles').select('full_name, role').eq('id', session.user.id).single()
      setProfile(prof)

      const [contentRes, citiesRes] = await Promise.all([
        supabase.from('content_records').select('id, title, slug, status, content_type, category, city_id, published_at, created_at, word_count, quality_score, seo_score').eq('brand', 'livin').order('created_at', { ascending: false }).limit(50),
        supabase.from('cities').select('id, name, slug').eq('is_active', true),
      ])
      setContent(contentRes.data || [])
      setCities(new Map((citiesRes.data || []).map(c => [c.id, c])))
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return <div style={{ fontFamily: "'Outfit',sans-serif", minHeight: '100vh', background: '#F5F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: '14px', color: '#999' }}>Loading content...</div></div>

  const statusColors: Record<string, { bg: string; color: string }> = {
    published: { bg: '#ECFDF5', color: '#22C580' }, awaiting_approval: { bg: '#FFF5ED', color: '#E85D2A' },
    mm_approved: { bg: '#EFF6FF', color: '#2D7DD2' }, seo_optimized: { bg: '#F5F0FF', color: '#7C3AED' },
    generating: { bg: '#EFF6FF', color: '#2D7DD2' }, queued: { bg: '#F5F3EF', color: '#999' },
    confirmed: { bg: '#ECFDF5', color: '#22C580' }, confirming: { bg: '#EFF6FF', color: '#2D7DD2' },
    linked: { bg: '#F5F0FF', color: '#7C3AED' }, archived: { bg: '#F5F3EF', color: '#999' },
  }

  return (
    <DashboardShell role="admin" userName={profile?.full_name || 'Admin'} activeTab="Content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontFamily: "'Libre Caslon Display', serif", fontSize: '22px', color: '#1a1a1a' }}>Content pipeline ({content.length})</h2>
      </div>

      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #EEEAE4', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr', padding: '12px 18px', borderBottom: '1px solid #EEEAE4', fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <span>Title</span><span>City</span><span>Type</span><span>Status</span><span>Date</span>
        </div>
        {content.map(c => {
          const city = cities.get(c.city_id)
          const sc = statusColors[c.status] || statusColors.queued
          return (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr', padding: '10px 18px', borderBottom: '1px solid #F5F3EF', alignItems: 'center', fontSize: '13px' }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                <a href={city ? `/${city.slug}/${c.slug}` : '#'} target="_blank" style={{ fontWeight: 500, color: '#1a1a1a', textDecoration: 'none' }}>{c.title}</a>
              </div>
              <span style={{ color: '#999', fontSize: '12px' }}>{city?.name || '—'}</span>
              <span style={{ color: '#999', fontSize: '12px' }}>{(c.content_type || '').replace(/_/g, ' ')}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px', background: sc.bg, color: sc.color, display: 'inline-block', width: 'fit-content' }}>
                {c.status.replace(/_/g, ' ')}
              </span>
              <span style={{ color: '#ccc', fontSize: '12px' }}>
                {c.published_at ? new Date(c.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
              </span>
            </div>
          )
        })}
      </div>
      <LiviMessage text={`${content.filter(c => c.status === 'published').length} published, ${content.filter(c => c.status !== 'published' && c.status !== 'archived').length} in pipeline across ${new Set(content.map(c => c.city_id)).size} cities.`} />
    </DashboardShell>
  )
}
