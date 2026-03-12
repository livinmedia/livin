// ============================================================
// EventsColumn + PropertiesColumn
// Exact match to livin_mock_up.png
// Real crowd photos for events, real house photos for properties
// ============================================================

// ── EVENTS ──────────────────────────────────────────────────

const EVENTS = [
  {
    name: 'Community Farmers Market',
    date: 'Saturday, May · Town Center Plaza',
    attendees: '35,090 est/we thesse · 1.88%',
    photo: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&q=80&auto=format&fit=crop',
  },
  {
    name: 'Wine & Food Festival',
    date: 'Friday, May · Waterway Square',
    attendees: '5,000 · nepvrs · 1.40%',
    photo: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80&auto=format&fit=crop',
  },
]

export function EventsColumn() {
  return (
    <>
      <style>{`
        .evt-cards { display: flex; gap: 12px; }
        .evt-card {
          flex: 1;
          background: #fff;
          border: 1px solid #ebebeb;
          border-radius: 8px;
          overflow: hidden;
          display: block;
          transition: box-shadow 0.18s, transform 0.18s;
        }
        .evt-card:hover {
          box-shadow: 0 4px 14px rgba(0,0,0,0.09);
          transform: translateY(-2px);
        }
        .evt-photo {
          width: 100%;
          height: 118px;
          object-fit: cover;
          display: block;
        }
        .evt-body { padding: 10px 11px; }
        .evt-name {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 6px;
          line-height: 1.3;
        }
        .evt-row {
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: #888;
          margin-bottom: 3px;
        }
        .evt-icon { font-size: 10px; }
        .evt-view-all {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin-top: 12px;
          padding: 9px;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          color: #555;
          width: 100%;
          transition: background 0.15s;
          text-decoration: none;
        }
        .evt-view-all:hover { background: #f5f5f5; }
      `}</style>

      <div>
        <div className="evt-cards">
          {EVENTS.map(e => (
            <a href="#" key={e.name} className="evt-card">
              <img src={e.photo} alt={e.name} className="evt-photo" />
              <div className="evt-body">
                <div className="evt-name">{e.name}</div>
                <div className="evt-row">
                  <span className="evt-icon">📅</span>
                  <span>{e.date}</span>
                </div>
                <div className="evt-row">
                  <span className="evt-icon">👥</span>
                  <span>{e.attendees}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
        <a href="#" className="evt-view-all">View All Neighborhoods &rsaquo;</a>
      </div>
    </>
  )
}

// ── PROPERTIES ──────────────────────────────────────────────

const PROPERTIES = [
  {
    price: '$995,000',
    detail: '5 beds · 4 baths · 3,100 sqft',
    detail2: '1,200 · $550',
    photo: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80&auto=format&fit=crop',
  },
  {
    price: '$1,450,000',
    detail: '6 beds · 5 baths · 5,100 sqft',
    detail2: '5,000 · nepvrs · 3338',
    photo: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80&auto=format&fit=crop',
  },
]

type PropsProps = { halLink?: string | null }

export function PropertiesColumn({ halLink }: PropsProps) {
  return (
    <>
      <style>{`
        .prop-cards { display: flex; gap: 12px; }
        .prop-card {
          flex: 1;
          background: #fff;
          border: 1px solid #ebebeb;
          border-radius: 8px;
          overflow: hidden;
          display: block;
          transition: box-shadow 0.18s, transform 0.18s;
        }
        .prop-card:hover {
          box-shadow: 0 4px 14px rgba(0,0,0,0.09);
          transform: translateY(-2px);
        }
        .prop-photo {
          width: 100%;
          height: 118px;
          object-fit: cover;
          display: block;
        }
        .prop-body { padding: 10px 11px; }
        .prop-price {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 6px;
        }
        .prop-row {
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: #888;
          margin-bottom: 3px;
        }
        .prop-icon { font-size: 10px; }
        .prop-view-all {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin-top: 12px;
          padding: 9px;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          color: #555;
          width: 100%;
          transition: background 0.15s;
          text-decoration: none;
          display: block;
          text-align: center;
        }
        .prop-view-all:hover { background: #f5f5f5; }
      `}</style>

      <div>
        <div className="prop-cards">
          {PROPERTIES.map(p => (
            <a href={halLink || '#'} key={p.price} className="prop-card">
              <img src={p.photo} alt={p.price} className="prop-photo" />
              <div className="prop-body">
                <div className="prop-price">{p.price}</div>
                <div className="prop-row">
                  <span className="prop-icon">🛏</span>
                  <span>{p.detail}</span>
                </div>
                <div className="prop-row">
                  <span className="prop-icon">📐</span>
                  <span>{p.detail2}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
        <a href={halLink || '#'} className="prop-view-all">View All Listings &rsaquo;</a>
      </div>
    </>
  )
}
