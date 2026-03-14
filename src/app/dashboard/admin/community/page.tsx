'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { DashboardShell, CommunityPost, LiviMessage } from '@/components/DashboardComponents'

export default function CommunityTab() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [mvps, setMvps] = useState<any[]>([])

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('user_profiles').select('full_name, role').eq('id', session.user.id).single()
      setProfile(prof)

      const [postsRes, mvpsRes] = await Promise.all([
        supabase.from('community_posts').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('market_vendor_partners').select('id, business_name, ad_tier, city_id').eq('is_active', true),
      ])
      setPosts(postsRes.data || [])
      setMvps(mvpsRes.data || [])
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return <div style={{ fontFamily: "'Outfit',sans-serif", minHeight: '100vh', background: '#F5F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: '14px', color: '#999' }}>Loading communities...</div></div>

  return (
    <DashboardShell role="admin" userName={profile?.full_name || 'Admin'} activeTab="Community">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontFamily: "'Libre Caslon Display', serif", fontSize: '22px', color: '#1a1a1a' }}>Communities</h2>
      </div>

      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #EEEAE4', padding: '24px' }}>
        {posts.length > 0 ? posts.map(p => (
          <CommunityPost key={p.id} name="User" role={p.author_role === 'market_mayor' ? 'Market Mayor' : p.author_role === 'admin' ? 'Admin' : 'MVP'} text={p.body} time="Recent" />
        )) : (
          <>
            <CommunityPost name="Marcus Williams" role="Market Mayor" text="Welcome to the Houston LIVIN community! Looking forward to connecting with all our local partners." time="Today" replies={2} />
            {mvps.slice(0, 3).map(mvp => (
              <CommunityPost key={mvp.id} name={mvp.business_name} role="MVP" text={`Excited to be a ${mvp.ad_tier} partner in the LIVIN network!`} time="Recent" />
            ))}
            <CommunityPost name="Anthony Dazet" role="Admin" text="Great to see the communities forming. More cities coming this week — the content pipeline is running." time="1h ago" />
          </>
        )}

        <div style={{
          margin: '16px 0 0', padding: '12px 16px', background: '#F5F3EF',
          borderRadius: '12px', fontSize: '13px', color: '#999',
        }}>
          Post an update across all communities...
        </div>
      </div>
      <LiviMessage text="Community boards are city-scoped. MMs and MVPs can only see their own city's community. As admin, you see all communities." />
    </DashboardShell>
  )
}
