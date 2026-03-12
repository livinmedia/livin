// ============================================================
// CityHero — Exact match to livin_mock_up.png
// Real aerial city photo bg, dark overlay bottom half
// Title left-aligned, NO eyebrow text, search bar left-aligned
// ============================================================

import LivinNav from './LivinNav'

type Props = {
  cityName: string
  stateAbbr: string
  mayorName?: string
}

// State-keyed Unsplash aerial/skyline photos
const HERO_PHOTOS: Record<string, string> = {
  TX: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?w=1400&q=85&auto=format&fit=crop',
  CA: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1400&q=85&auto=format&fit=crop',
  NY: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1400&q=85&auto=format&fit=crop',
  FL: 'https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=1400&q=85&auto=format&fit=crop',
  IL: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=1400&q=85&auto=format&fit=crop',
  WA: 'https://images.unsplash.com/photo-1438401171849-74ac270044ee?w=1400&q=85&auto=format&fit=crop',
  CO: 'https://images.unsplash.com/photo-1619856699906-09e1f58c98b1?w=1400&q=85&auto=format&fit=crop',
  GA: 'https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=1400&q=85&auto=format&fit=crop',
  TN: 'https://images.unsplash.com/photo-1545419913-775e3f043e5e?w=1400&q=85&auto=format&fit=crop',
  AZ: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=85&auto=format&fit=crop',
  NV: 'https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=1400&q=85&auto=format&fit=crop',
  OR: 'https://images.unsplash.com/photo-1497864149936-d3163f0c0f4b?w=1400&q=85&auto=format&fit=crop',
  NC: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1400&q=85&auto=format&fit=crop',
  DEFAULT: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1400&q=85&auto=format&fit=crop',
}

export default function CityHero({ cityName, stateAbbr, mayorName }: Props) {
  const photo = HERO_PHOTOS[stateAbbr] || HERO_PHOTOS.DEFAULT

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

        .chero {
          position: relative;
          width: 100%;
          height: 420px;
          overflow: hidden;
          background: #1a2a1e;
        }
        .chero-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 35%;
        }
        /* gradient: transparent top (so nav text reads), darkening bottom */
        .chero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(0,0,0,0.18) 0%,
            rgba(0,0,0,0.22) 30%,
            rgba(0,0,0,0.55) 65%,
            rgba(0,0,0,0.78) 100%
          );
        }
        .chero-body {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 0 28px 32px;
          z-index: 10;
        }
        .chero-title {
          font-family: 'Oswald', sans-serif;
          font-size: 42px;
          font-weight: 700;
          color: #fff;
          line-height: 1.1;
          margin-bottom: 8px;
          text-transform: none;
          letter-spacing: -0.3px;
          max-width: 520px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.35);
        }
        .chero-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: rgba(255,255,255,0.88);
          margin-bottom: 20px;
          font-weight: 400;
        }
        /* Search bar — white background, left-aligned, NOT full width */
        .chero-search {
          display: inline-flex;
          align-items: center;
          background: #fff;
          border-radius: 7px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        }
        .chero-sel {
          height: 44px;
          padding: 0 12px 0 10px;
          border: none;
          border-right: 1px solid #e0e0e0;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #1a1a1a;
          background: #fff;
          cursor: pointer;
          outline: none;
          min-width: 88px;
        }
        .chero-sel:last-of-type { border-right: none; }
        .chero-search-btn {
          height: 44px;
          padding: 0 28px;
          background: #f5a623;
          color: #fff;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.2px;
          transition: background 0.15s;
        }
        .chero-search-btn:hover { background: #e09018; }
      `}</style>

      <div className="chero">
        <img src={photo} alt={`${cityName} aerial view`} className="chero-photo" />
        <div className="chero-overlay" />
        <LivinNav mayorName={mayorName} />
        <div className="chero-body">
          <h1 className="chero-title">
            Experience the Best of<br />{cityName}, {stateAbbr}
          </h1>
          <p className="chero-subtitle">Your guide to the finest living, business, and events.</p>
          <div className="chero-search">
            <select className="chero-sel">
              <option>Buy</option>
              <option>Rent</option>
              <option>Explore</option>
            </select>
            <select className="chero-sel">
              <option>Neighborhoods</option>
              <option>All Areas</option>
            </select>
            <select className="chero-sel">
              <option>Price Range</option>
              <option>Any Price</option>
            </select>
            <button className="chero-search-btn">Search</button>
          </div>
        </div>
      </div>
    </>
  )
}
