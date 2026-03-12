'use client'
// ============================================================
// LivinNav — Exact match to livin_mock_up.png
// Transparent overlay on hero photo
// Logo left | Links center | Dark navy pill CTA right
// ============================================================

type Props = { mayorName?: string }

export default function LivinNav({ mayorName = 'Mayor Scott' }: Props) {
  return (
    <>
      <style>{`
        .lnav {
          position: absolute;
          top: 0; left: 0; right: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          padding: 16px 28px;
          gap: 0;
        }
        .lnav-logo {
          font-family: 'Oswald', 'DM Sans', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 1px;
          text-transform: uppercase;
          flex-shrink: 0;
          text-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        .lnav-links {
          display: flex;
          gap: 24px;
          list-style: none;
          margin: 0 auto;
        }
        .lnav-links a {
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          color: rgba(255,255,255,0.95);
          display: inline-flex;
          align-items: center;
          gap: 3px;
          text-shadow: 0 1px 3px rgba(0,0,0,0.25);
        }
        .lnav-links a .chevron {
          font-size: 9px;
          opacity: 0.75;
          margin-top: 1px;
        }
        .lnav-cta {
          background: #1a2744;
          color: #fff;
          border: none;
          padding: 9px 18px;
          border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          letter-spacing: 0.1px;
        }
        .lnav-cta:hover { background: #243158; }
      `}</style>
      <nav className="lnav">
        <div className="lnav-logo">LIVIN</div>
        <ul className="lnav-links">
          {['Explore','Events','Properties','Businesses'].map(l => (
            <li key={l}>
              <a href="#">{l} <span className="chevron">▾</span></a>
            </li>
          ))}
        </ul>
        <button className="lnav-cta">Contact {mayorName}</button>
      </nav>
    </>
  )
}
