'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { DashboardShell, DCard, StatusRow, LiviMessage } from '@/components/DashboardComponents'

export default function CitiesTab() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [cities, setCities] = useState<any[]>([])
  const [contentCounts, setContentCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('user_profiles').select('full_name, role').eq('id', session.user.id).single()
      setProfile(prof)

      const { data: citiesData } = await supabase.from('cities').select('id, name, slug, population, is_active, is_pilot, has_market_mayor, content_status').eq('is_active', true).order('name')
      setCities(citiesData || [])

      // Get content counts per city
      const { data: content } = await supabase.from('content_records').select('city_id').eq('status', 'published').eq('brand', 'livin')
      const counts: Record<string, number> = {}
      content?.forEach(c => { counts[c.city_id] = (counts[c.city_id] || 0) + 1 })
      setContentCounts(counts)
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return <div style={{ fontFamily: "'Outfit',sans-serif", minHeight: '100vh', background: '#F5F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: '14px', color: '#999' }}>Loading cities...</div></div>

  return (
    <DashboardShell role="admin" userName={profile?.full_name || 'Admin'} activeTab="Cities">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontFamily: "'Libre Caslon Display', serif", fontSize: '22px', color: '#1a1a1a' }}>All cities ({cities.length})</h2>
      </div>

      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #EEEAE4', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 18px', borderBottom: '1px solid #EEEAE4', fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <span>City</span><span>Population</span><span>Articles</span><span>Market Mayor</span><span>Status</span>
        </div>
        {/* Rows */}
        {cities.map(city => {
          const articleCount = contentCounts[city.id] || 0
          return (
            <div key={city.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '10px 18px', borderBottom: '1px solid #F5F3EF', alignItems: 'center', fontSize: '13px' }}>
              <div>
                <a href={`/${city.slug}`} target="_blank" style={{ fontWeight: 500, color: '#1a1a1a', textDecoration: 'none' }}>{city.name}</a>
                {city.is_pilot && <span style={{ marginLeft: '6px', fontSize: '9px', fontWeight: 600, padding: '2px 8px', background: '#FFF5ED', color: '#E85D2A', borderRadius: '100px' }}>Pilot</span>}
              </div>
              <span style={{ color: '#999' }}>{city.population ? city.population.toLocaleString() : '—'}</span>
              <span style={{ color: articleCount > 0 ? '#22C580' : '#ccc', fontWeight: articleCount > 0 ? 600 : 400 }}>{articleCount}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px', background: city.has_market_mayor ? '#ECFDF5' : '#F5F3EF', color: city.has_market_mayor ? '#22C580' : '#ccc', display: 'inline-block', width: 'fit-content' }}>
                {city.has_market_mayor ? 'Active' : 'Open'}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 500, color: city.content_status === 'active' ? '#22C580' : city.content_status === 'seeding' ? '#E85D2A' : '#999' }}>
                {city.content_status || 'pending'}
              </span>
            </div>
          )
        })}
      </div>
      <LiviMessage text={`${cities.length} cities active. ${cities.filter(c => c.has_market_mayor).length} have Market Mayors. ${Object.values(contentCounts).filter(v => v > 0).length} cities have published content.`} />
    </DashboardShell>
  )
}
