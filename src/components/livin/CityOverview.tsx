// ============================================================
// CityOverview — Exact match to livin_mock_up.png
// Semicircle gauge (half arc) | 4 stats | centered more btn
// ============================================================

export default function CityOverview() {
  return (
    <>
      <style>{`
        .cov {
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          padding: 20px 24px 16px;
          margin-bottom: 36px;
        }
        .cov-top {
          display: flex;
          align-items: center;
          gap: 28px;
          margin-bottom: 14px;
        }
        /* Semicircle gauge */
        .cov-gauge {
          position: relative;
          width: 110px;
          height: 68px;
          flex-shrink: 0;
        }
        .cov-gauge svg {
          width: 110px;
          height: 68px;
          overflow: visible;
        }
        .cov-gauge-label {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          text-align: center;
        }
        .cov-gauge-num {
          font-family: 'DM Sans', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #2a7d4f;
          line-height: 1;
          display: block;
        }
        .cov-gauge-word {
          display: inline-block;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 700;
          color: #2a7d4f;
          background: #e8f5ee;
          padding: 1px 8px;
          border-radius: 999px;
          margin-top: 2px;
        }
        /* Stats row */
        .cov-stats {
          display: flex;
          gap: 32px;
          align-items: flex-start;
          flex: 1;
        }
        .cov-stat {}
        .cov-stat-val {
          font-family: 'DM Sans', sans-serif;
          font-size: 19px;
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.2;
        }
        .cov-stat-chg {
          font-size: 11px;
          color: #2a7d4f;
          font-weight: 600;
          margin-left: 3px;
        }
        .cov-stat-lbl {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: #9e9e9e;
          margin-top: 2px;
        }
        .cov-stat-icon {
          font-size: 18px;
          margin-bottom: 2px;
        }
        /* More button */
        .cov-more {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 4px;
          padding: 8px 20px;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 999px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px;
          font-weight: 500;
          color: #555;
          cursor: pointer;
          width: fit-content;
          margin-left: auto;
          margin-right: auto;
          transition: border-color 0.15s;
        }
        .cov-more:hover { border-color: #bbb; }
      `}</style>

      <div className="cov">
        <div className="cov-top">
          {/* Semicircle gauge — half arc only like the mockup */}
          <div className="cov-gauge">
            <svg viewBox="0 0 110 68" fill="none">
              {/* Track arc */}
              <path
                d="M 10 65 A 45 45 0 0 1 100 65"
                fill="none"
                stroke="#e8f0ec"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Fill arc — ~75% of 180deg = 135deg */}
              <path
                d="M 10 65 A 45 45 0 0 1 100 65"
                fill="none"
                stroke="#4caf50"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="141.4"
                strokeDashoffset="35"
              />
            </svg>
            <div className="cov-gauge-label">
              <span className="cov-gauge-num">82</span>
              <span className="cov-gauge-word">Healthy</span>
            </div>
          </div>

          {/* Stats */}
          <div className="cov-stats">
            <div className="cov-stat">
              <div className="cov-stat-val">
                45,320 <span className="cov-stat-chg">+1.88%</span>
              </div>
              <div className="cov-stat-lbl">Population</div>
              <div style={{ fontSize: 10, color: '#bbb', marginTop: 1 }}>growth</div>
            </div>
            <div className="cov-stat">
              <div className="cov-stat-val">+1,832</div>
              <div className="cov-stat-lbl">New Residents</div>
            </div>
            <div className="cov-stat">
              <div className="cov-stat-val">342</div>
              <div className="cov-stat-lbl">Local Businesses</div>
            </div>
            <div className="cov-stat">
              <div className="cov-stat-val">312,29</div>
              <div className="cov-stat-lbl">Locals forever</div>
            </div>
            <div className="cov-stat">
              <div className="cov-stat-icon">🏠</div>
              <div className="cov-stat-lbl">High value</div>
            </div>
          </div>
        </div>

        <button className="cov-more">⊕ More Community Insights</button>
      </div>
    </>
  )
}
