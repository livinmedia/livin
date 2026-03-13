'use client'

export default function Nav() {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 clamp(24px, 4vw, 80px)',
      height: '64px',
      background: 'var(--lv-white)',
      borderBottom: '1px solid var(--lv-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(16px)',
    }}>
      <a href="/" style={{
        fontFamily: 'var(--font-display)',
        fontSize: '28px',
        color: 'var(--lv-black)',
        letterSpacing: '-0.02em',
      }}>
        LIVIN
      </a>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '28px',
      }}>
        {['Explore', 'Cities', 'Lifestyle', 'About'].map(item => (
          <a key={item} href={`#${item.toLowerCase()}`} style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--lv-text-muted)',
            transition: 'color 0.2s',
          }}>
            {item}
          </a>
        ))}
        <a href="/houston-texas" style={{
          padding: '8px 20px',
          background: 'var(--lv-black)',
          color: '#fff',
          borderRadius: 'var(--radius-pill)',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          Enter a city
        </a>
      </div>
    </nav>
  )
}
