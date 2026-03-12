'use client'
// ============================================================
// MarketMayorSection — Exact match to livin_mock_up.png
//
// Layout: left card (avatar circle + name + stars + bio + btns)
//         right side (large person photo + google rating box + orange CTA btn)
// The right side photo is a real person headshot
// ============================================================


type Props = {
  cityName: string
  mayorName?: string
}

export default function MarketMayorSection({ cityName, mayorName = 'Mayor Scott' }: Props) {
  return (
    <>
      <style>{`
        .mm-section {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 24px;
          align-items: start;
          margin-bottom: 48px;
        }
        /* LEFT CARD */
        .mm-card {
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          padding: 22px 24px;
        }
        .mm-identity {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
        }
        .mm-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          object-fit: cover;
          background: linear-gradient(135deg, #66bb6a, #2e7d32);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          overflow: hidden;
        }
        .mm-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .mm-name {
          font-family: 'DM Sans', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 3px;
        }
        .mm-stars { color: #f5a623; font-size: 15px; letter-spacing: 1px; }
        .mm-bio {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #777;
          line-height: 1.62;
          margin-bottom: 16px;
        }
        .mm-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mm-learn {
          background: #fff;
          border: 1px solid #ddd;
          padding: 7px 18px;
          border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #333;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .mm-learn:hover { border-color: #aaa; }
        .mm-icon-btn {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #aaa;
          padding: 4px;
          transition: color 0.15s, transform 0.15s;
        }
        .mm-icon-btn:hover { color: #555; transform: scale(1.1); }

        /* RIGHT SIDE */
        .mm-right {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          width: 200px;
        }
        .mm-photo {
          width: 190px;
          height: 210px;
          border-radius: 8px;
          object-fit: cover;
          object-position: top center;
          background: linear-gradient(145deg, #a5d6a7, #43a047);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 60px;
          overflow: hidden;
        }
        .mm-photo img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
        .mm-rating {
          width: 100%;
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 7px;
          padding: 9px 12px;
        }
        .mm-rating-row {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 4px;
        }
        .mm-g-logo {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 800;
        }
        .mm-g-logo span:nth-child(1) { color: #4285f4; }
        .mm-g-logo span:nth-child(2) { color: #ea4335; }
        .mm-g-logo span:nth-child(3) { color: #fbbc05; }
        .mm-g-logo span:nth-child(4) { color: #34a853; }
        .mm-g-logo span:nth-child(5) { color: #4285f4; }
        .mm-g-logo span:nth-child(6) { color: #ea4335; }
        .mm-g-stars { color: #f5a623; font-size: 12px; }
        .mm-g-score {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #1a1a1a;
        }
        .mm-rating-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: #888;
          line-height: 1.5;
        }
        .mm-cta {
          width: 100%;
          background: #f5a623;
          color: #fff;
          border: none;
          padding: 12px 0;
          border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, transform 0.12s;
          letter-spacing: 0.1px;
          text-align: center;
          display: block;
        }
        .mm-cta:hover { background: #e09018; transform: translateY(-1px); }

        @media (max-width: 700px) {
          .mm-section { grid-template-columns: 1fr; }
          .mm-right { width: 100%; flex-direction: row; flex-wrap: wrap; }
        }
      `}</style>

      <div className="mm-section">
        {/* LEFT — card with bio */}
        <div className="mm-card">
          <div className="mm-identity">
            <div className="mm-avatar">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80&auto=format&fit=crop"
                alt={mayorName}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
            <div>
              <div className="mm-name">{mayorName}</div>
              <div className="mm-stars">★★★★☆</div>
            </div>
          </div>
          <p className="mm-bio">
            Meet {mayorName}, your dedicated community leader and LIVIN Market Mayor
            for {cityName}. Here to connect you with a local or local living.
          </p>
          <div className="mm-actions">
            <button className="mm-learn">Learn More</button>
            <button className="mm-icon-btn" title="Save">♡</button>
            <button className="mm-icon-btn" title="Message">✉</button>
          </div>
        </div>

        {/* RIGHT — photo + rating + CTA */}
        <div className="mm-right">
          <div className="mm-photo">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&auto=format&fit=crop"
              alt={mayorName}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
          <div className="mm-rating">
            <div className="mm-rating-row">
              <span className="mm-g-logo">
                <span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span>
              </span>
              <span className="mm-g-stars">★★★★★</span>
              <span className="mm-g-score">4.8 out of 5</span>
            </div>
            <div className="mm-rating-text">
              Our Highest Listing site · #1 Multibuy Leads<br />
              Connecting locals with the best of {cityName}.
            </div>
          </div>
          <button className="mm-cta">Contact {mayorName}</button>
        </div>
      </div>
    </>
  )
}
