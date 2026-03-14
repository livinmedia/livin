'use client'

import { useState } from 'react'

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 clamp(16px, 4vw, 80px)',
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

        {/* Desktop links */}
        <div className="lv-nav-links">
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

        {/* Hamburger button — mobile only */}
        <button
          className="lv-nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--lv-black)" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile nav overlay */}
      {menuOpen && (
        <div className="lv-mobile-nav">
          <button
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'none', border: 'none', cursor: 'pointer',
              width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--lv-black)" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {['Explore', 'Cities', 'Lifestyle', 'About'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)} style={{
              fontSize: '18px',
              fontWeight: 500,
              color: 'var(--lv-black)',
              padding: '14px 0',
              borderBottom: '1px solid var(--lv-border)',
            }}>
              {item}
            </a>
          ))}
          <a href="/houston-texas" onClick={() => setMenuOpen(false)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: '16px',
            padding: '14px 28px',
            background: 'var(--lv-orange-grad)',
            color: '#fff',
            borderRadius: 'var(--radius-pill)',
            fontSize: '16px',
            fontWeight: 600,
            minHeight: '48px',
          }}>
            Enter a city
          </a>
        </div>
      )}
    </>
  )
}
