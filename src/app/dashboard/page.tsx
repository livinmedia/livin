import Link from 'next/link'

export default function DashboardIndex() {
  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif",
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #FFF8F0 0%, #FEF0E4 25%, #F0F4FF 60%, #EAF8F0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{
          fontFamily: "'Libre Caslon Display', serif",
          fontSize: '36px', color: '#1a1a1a', marginBottom: '8px',
        }}>
          LIVIN
        </div>
        <p style={{ fontSize: '16px', fontWeight: 300, color: '#999', marginBottom: '32px' }}>
          Select your dashboard
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href="/dashboard/admin" style={{
            display: 'block', padding: '20px 24px',
            background: '#fff', border: '1px solid #EEEAE4', borderRadius: '14px',
            textDecoration: 'none', textAlign: 'left',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginBottom: '4px' }}>
              Admin Control Panel
            </div>
            <div style={{ fontSize: '13px', fontWeight: 300, color: '#999' }}>
              Full network overview. All cities, agents, integrations, and communities.
            </div>
          </Link>

          <Link href="/dashboard/mm" style={{
            display: 'block', padding: '20px 24px',
            background: '#fff', border: '1px solid #EEEAE4', borderRadius: '14px',
            textDecoration: 'none', textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>Market Mayor Dashboard</span>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 10px', background: '#FFF5ED', color: '#E85D2A', borderRadius: '100px' }}>Houston</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 300, color: '#999' }}>
              City health, leads, content approval, local partners, and community.
            </div>
          </Link>

          <Link href="/dashboard/mvp" style={{
            display: 'block', padding: '20px 24px',
            background: '#fff', border: '1px solid #EEEAE4', borderRadius: '14px',
            textDecoration: 'none', textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>Partner Dashboard</span>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 10px', background: '#EFF6FF', color: '#2D7DD2', borderRadius: '100px' }}>MVP</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 300, color: '#999' }}>
              Business score, ad performance, community access, and partner network.
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
