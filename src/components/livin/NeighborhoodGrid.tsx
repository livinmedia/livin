// ============================================================
// NeighborhoodGrid — Exact match to livin_mock_up.png
// Real house/neighborhood photos, 4 columns
// Card: photo | name bold | desc small | pin + label + arrow btn
// ============================================================

const NEIGHBORHOODS = [
  {
    name: 'Alden Bridge',
    desc: 'Family-friendly with woods trails',
    meta: 'Alden Bridge · Near support',
    photo: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&q=80&auto=format&fit=crop',
  },
  {
    name: 'East Shore',
    desc: 'Luxury lakeside living',
    meta: 'East Shore · Near support',
    photo: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80&auto=format&fit=crop',
  },
  {
    name: 'Creekside Park',
    desc: 'Elegant new homes among parks',
    meta: 'Local Businesses',
    photo: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80&auto=format&fit=crop',
  },
  {
    name: 'Town Center',
    desc: 'Vibrant urban core',
    meta: 'Town Center · Fourth view',
    photo: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80&auto=format&fit=crop',
  },
]

export default function NeighborhoodGrid() {
  return (
    <>
      <style>{`
        .nbhd-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 40px;
        }
        .nbhd-card {
          background: #fff;
          border: 1px solid #ebebeb;
          border-radius: 8px;
          overflow: hidden;
          display: block;
          transition: box-shadow 0.18s, transform 0.18s;
        }
        .nbhd-card:hover {
          box-shadow: 0 5px 18px rgba(0,0,0,0.11);
          transform: translateY(-2px);
        }
        .nbhd-photo {
          width: 100%;
          height: 148px;
          object-fit: cover;
          display: block;
        }
        .nbhd-body { padding: 10px 12px 12px; }
        .nbhd-name {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 3px;
        }
        .nbhd-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: #888;
          line-height: 1.4;
          margin-bottom: 9px;
        }
        .nbhd-foot {
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: #999;
        }
        .nbhd-pin { color: #e53935; font-size: 11px; }
        .nbhd-arr {
          margin-left: auto;
          width: 22px; height: 22px;
          background: #f5f5f5;
          border: none; border-radius: 50%;
          font-size: 11px; color: #555;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
        }
        .nbhd-arr:hover { background: #ebebeb; }
        @media (max-width: 860px) { .nbhd-grid { grid-template-columns: repeat(2,1fr); } }
      `}</style>

      <div className="nbhd-grid">
        {NEIGHBORHOODS.map(n => (
          <a href="#" key={n.name} className="nbhd-card">
            <img src={n.photo} alt={n.name} className="nbhd-photo" />
            <div className="nbhd-body">
              <div className="nbhd-name">{n.name}</div>
              <div className="nbhd-desc">{n.desc}</div>
              <div className="nbhd-foot">
                <span className="nbhd-pin">📍</span>
                <span>{n.meta}</span>
                <button className="nbhd-arr">↗</button>
              </div>
            </div>
          </a>
        ))}
      </div>
    </>
  )
}
