'use client'

// ── Stat Card ──
export function StatCard({ label, value, change, changeColor, icon, iconBg, iconColor }: {
  label: string; value: string | number; change?: string; changeColor?: string
  icon: string; iconBg: string; iconColor: string
}) {
  return (
    <div style={{
      padding: '16px 18px', background: '#fff', borderRadius: '14px',
      border: '1px solid #EEEAE4',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#999' }}>{label}</span>
        <div style={{
          width: '32px', height: '32px', borderRadius: '10px',
          background: iconBg, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '16px', color: iconColor,
        }}>{icon}</div>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', marginBottom: '2px' }}>{value}</div>
      {change && <div style={{ fontSize: '12px', fontWeight: 500, color: changeColor || '#22C580' }}>{change}</div>}
    </div>
  )
}

// ── Card Wrapper ──
export function DCard({ title, subtitle, children, minHeight }: {
  title: string; subtitle?: string; children: React.ReactNode; minHeight?: string
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: '14px', border: '1px solid #EEEAE4',
      padding: '18px', minHeight: minHeight || 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>{title}</span>
        {subtitle && <span style={{ fontSize: '11px', color: '#999' }}>{subtitle}</span>}
      </div>
      {children}
    </div>
  )
}

// ── Health Meter ──
export function HealthMeter({ score, label, stats }: {
  score: number; label: string
  stats: Array<{ value: string; label: string }>
}) {
  const color = score >= 80 ? '#22C580' : score >= 60 ? '#F4B860' : '#E85D2A'
  const bgColor = score >= 80 ? '#ECFDF5' : score >= 60 ? '#FFF8E1' : '#FFF5ED'
  const pct = Math.min(score / 100, 1)
  const deg = pct * 360

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '8px 0' }}>
      <div style={{
        width: '110px', height: '110px', borderRadius: '50%',
        background: `conic-gradient(${color} ${deg}deg, #EEEAE4 ${deg}deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{
          width: '88px', height: '88px', borderRadius: '50%', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <span style={{ fontSize: '32px', fontWeight: 700, color }}>{score}</span>
        </div>
      </div>
      <span style={{
        fontSize: '12px', fontWeight: 600, color, padding: '3px 12px',
        background: bgColor, borderRadius: '100px',
      }}>{label}</span>
      {stats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: '10px', width: '100%', marginTop: '8px' }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}>{s.value}</div>
              <div style={{ fontSize: '10px', color: '#999' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Lead Row ──
export function LeadRow({ name, type, status, statusColor, statusBg, avatarColor }: {
  name: string; type: string; status: string; statusColor: string; statusBg: string; avatarColor: string
}) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2)
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: '1px solid #F5F3EF',
    }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%', background: avatarColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 600, color: '#fff', flexShrink: 0,
        }}>{initials}</div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>{name}</div>
          <div style={{ fontSize: '11px', color: '#999' }}>{type}</div>
        </div>
      </div>
      <span style={{
        fontSize: '11px', fontWeight: 600, padding: '3px 10px',
        borderRadius: '100px', background: statusBg, color: statusColor,
      }}>{status}</span>
    </div>
  )
}

// ── Activity Row ──
export function ActivityRow({ text, time, dotColor }: {
  text: string; time: string; dotColor: string
}) {
  return (
    <div style={{
      display: 'flex', gap: '10px', alignItems: 'flex-start',
      padding: '7px 0', borderBottom: '1px solid #F5F3EF',
    }}>
      <div style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: dotColor, marginTop: '5px', flexShrink: 0,
      }} />
      <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.3, flex: 1 }}>{text}</div>
      <span style={{ fontSize: '11px', color: '#ccc', whiteSpace: 'nowrap', flexShrink: 0 }}>{time}</span>
    </div>
  )
}

// ── Status Row ──
export function StatusRow({ name, status, statusColor, statusBg }: {
  name: string; status: string; statusColor: string; statusBg: string
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '7px 0', borderBottom: '1px solid #F5F3EF',
    }}>
      <span style={{ fontSize: '12px', fontWeight: 500, color: '#1a1a1a' }}>{name}</span>
      <span style={{
        fontSize: '10px', fontWeight: 600, padding: '3px 10px',
        borderRadius: '100px', background: statusBg, color: statusColor,
      }}>{status}</span>
    </div>
  )
}

// ── LIVI Message ──
export function LiviMessage({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex', gap: '10px', alignItems: 'flex-start',
      padding: '12px 14px', background: '#FFF5ED', borderRadius: '12px',
      border: '1px solid #FDDCBB', marginTop: '10px',
    }}>
      <div style={{
        width: '30px', height: '30px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #FF8C3C, #E85D2A)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '10px', color: '#fff', fontWeight: 700, flexShrink: 0,
      }}>L</div>
      <div style={{ fontSize: '12px', color: '#93400D', lineHeight: 1.4 }}>
        <span style={{ fontWeight: 600 }}>LIVI:</span> {text}
      </div>
    </div>
  )
}

// ── Community Post ──
export function CommunityPost({ name, role, text, time, replies }: {
  name: string; role: string; text: string; time: string; replies?: number
}) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2)
  const roleColor = role === 'Market Mayor' ? '#E85D2A' : role === 'Admin' ? '#7C3AED' : '#2D7DD2'
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #F5F3EF' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%', background: roleColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 600, color: '#fff', flexShrink: 0,
        }}>{initials}</div>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a1a' }}>{name}</span>
        <span style={{
          fontSize: '9px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px',
          background: roleColor + '15', color: roleColor, textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>{role}</span>
        <span style={{ fontSize: '10px', color: '#ccc', marginLeft: 'auto' }}>{time}</span>
      </div>
      <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.4, paddingLeft: '34px' }}>{text}</div>
      {replies && replies > 0 && (
        <div style={{ paddingLeft: '34px', marginTop: '4px', fontSize: '11px', color: '#E85D2A', fontWeight: 500 }}>
          {replies} {replies === 1 ? 'reply' : 'replies'}
        </div>
      )}
    </div>
  )
}

// ── Quick Action Button ──
export function QuickAction({ label, bg, border, color }: {
  label: string; bg: string; border: string; color: string
}) {
  return (
    <div style={{
      padding: '10px 14px', background: bg, border: `1px solid ${border}`,
      borderRadius: '10px', fontSize: '13px', fontWeight: 500, color, cursor: 'pointer',
    }}>{label}</div>
  )
}

// ── Dashboard Layout Shell ──
export function DashboardShell({ role, cityName, userName, activeTab, children }: {
  role: 'admin' | 'mm' | 'mvp'; cityName?: string; userName: string; activeTab?: string; children: React.ReactNode
}) {
  const titles = { admin: 'Admin Control Panel', mm: 'Market Mayor Dashboard', mvp: 'Partner Dashboard' }
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2)

  const basePath = `/dashboard/${role}`
  const adminTabs = [
    { label: 'Overview', path: '' },
    { label: 'Cities', path: '/cities' },
    { label: 'Content', path: '/content' },
    { label: 'Leads', path: '/leads' },
    { label: 'Partners', path: '/partners' },
    { label: 'Agents', path: '/agents' },
    { label: 'Community', path: '/community' },
    { label: 'Settings', path: '/settings' },
  ]
  const mmTabs = [
    { label: 'Overview', path: '' },
    { label: 'Content', path: '/content' },
    { label: 'Leads', path: '/leads' },
    { label: 'Partners', path: '/partners' },
    { label: 'Community', path: '/community' },
    { label: 'Profile', path: '/profile' },
  ]
  const mvpTabs = [
    { label: 'Overview', path: '' },
    { label: 'Performance', path: '/performance' },
    { label: 'Leads', path: '/leads' },
    { label: 'Community', path: '/community' },
    { label: 'Profile', path: '/profile' },
  ]

  const tabs = role === 'admin' ? adminTabs : role === 'mm' ? mmTabs : mvpTabs
  const current = activeTab || 'Overview'

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif", color: '#1a1a1a',
      minHeight: '100vh', background: '#F5F3EF',
    }}>
      {/* Top nav */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 24px', height: '56px', background: '#fff',
        borderBottom: '1px solid #EEEAE4', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/" style={{ fontFamily: "'Libre Caslon Display', serif", fontSize: '22px', color: '#1a1a1a', textDecoration: 'none' }}>LIVIN</a>
          <span style={{ fontSize: '13px', fontWeight: 400, color: '#999' }}>{titles[role]}</span>
          {cityName && (
            <span style={{
              fontSize: '11px', fontWeight: 600, padding: '3px 12px',
              background: '#FFF5ED', color: '#E85D2A', borderRadius: '100px',
            }}>{cityName}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '7px 16px', background: '#F5F3EF', borderRadius: '100px',
            fontSize: '12px', color: '#999', width: '200px',
          }}>
            {role === 'admin' ? 'Search everything...' : 'Search...'}
          </div>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF9A5C, #E85D2A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', color: '#fff', fontWeight: 600,
          }}>{initials}</div>
        </div>
      </div>

      {/* Sub nav — real links */}
      <div style={{
        display: 'flex', gap: '4px', padding: '8px 24px',
        background: '#fff', borderBottom: '1px solid #EEEAE4',
      }}>
        {tabs.map(tab => {
          const isActive = tab.label === current
          return (
            <a key={tab.label} href={`${basePath}${tab.path}`} style={{
              padding: '6px 16px', borderRadius: '100px',
              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              background: isActive ? '#1a1a1a' : 'transparent',
              color: isActive ? '#fff' : '#999',
              textDecoration: 'none',
              transition: 'background 0.2s, color 0.2s',
            }}>{tab.label}</a>
          )
        })}
      </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '20px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        {children}
      </div>
    </div>
  )
}
