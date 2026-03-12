// ============================================================
// ArticleList — Article rows with thumbnail
// ============================================================

type Article = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  category?: string | null
  word_count?: number | null
  published_at?: string | null
}

type ArticleListProps = {
  articles: Article[]
  citySlug: string
  cityName: string
}

const THUMBS = [
  { bg: '#a5d6a7', emoji: '📰' },
  { bg: '#90caf9', emoji: '🏙️' },
  { bg: '#ffcc80', emoji: '🍽️' },
  { bg: '#ce93d8', emoji: '🎉' },
]

export function ArticleList({ articles, citySlug, cityName }: ArticleListProps) {
  if (!articles || articles.length === 0) {
    return (
      <>
        <style>{`
          .no-art { padding: 40px; text-align: center; background: #fafafa; border-radius: 8px; border: 1px solid #ebebeb; margin-bottom: 48px; }
          .no-art-t { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; color: #555; margin-bottom: 5px; }
          .no-art-s { font-size: 12px; color: #aaa; font-family: 'DM Sans', sans-serif; }
        `}</style>
        <div className="no-art">
          <div className="no-art-t">Content coming soon for {cityName}</div>
          <div className="no-art-s">Our AI content pipeline is warming up for this city.</div>
        </div>
      </>
    )
  }
  return (
    <>
      <style>{`
        .art-list { margin-bottom: 48px; }
        .art-row {
          display: flex; gap: 16px; padding: 14px 0;
          border-bottom: 1px solid #f0f0f0; align-items: flex-start;
        }
        .art-row:last-child { border-bottom: none; }
        .art-thumb {
          width: 76px; height: 76px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 26px;
        }
        .art-cat { font-family: 'DM Sans',sans-serif; font-size: 10px; font-weight: 700; color: #2a7d4f; text-transform: uppercase; letter-spacing: .7px; margin-bottom: 4px; }
        .art-title { font-family: 'DM Sans',sans-serif; font-size: 14px; font-weight: 700; color: #1a1a1a; line-height: 1.35; margin-bottom: 5px; }
        .art-exc { font-size: 12.5px; color: #888; line-height: 1.5; font-family: 'DM Sans',sans-serif; }
      `}</style>
      <div className="art-list">
        {articles.map((a, i) => {
          const t = THUMBS[i % THUMBS.length]
          return (
            <a href={`/${citySlug}/${a.slug}`} key={a.id} className="art-row">
              <div className="art-thumb" style={{ background: t.bg }}>{t.emoji}</div>
              <div style={{ flex: 1 }}>
                {a.category && <div className="art-cat">{a.category.replace(/-/g, ' ')}</div>}
                <div className="art-title">{a.title}</div>
                {a.excerpt && <div className="art-exc">{a.excerpt}</div>}
              </div>
            </a>
          )
        })}
      </div>
    </>
  )
}

// ============================================================
// LivinFooter — Exact match to livin_mock_up.png
// Near-black bg | LIVIN + socials left | copyright center | links right
// ============================================================

export function LivinFooter() {
  return (
    <>
      <style>{`
        .lfoot {
          background: #1a1a1a;
          padding: 16px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .lfoot-left { display: flex; align-items: center; gap: 12px; }
        .lfoot-logo {
          font-family: 'Oswald', 'DM Sans', sans-serif;
          font-size: 20px; font-weight: 700;
          color: #fff; letter-spacing: 1px; text-transform: uppercase;
        }
        .lfoot-socials { display: flex; gap: 7px; }
        .lfoot-soc {
          width: 26px; height: 26px;
          background: rgba(255,255,255,0.10);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; color: rgba(255,255,255,0.65);
          transition: background 0.15s;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
        }
        .lfoot-soc:hover { background: rgba(255,255,255,0.2); color: #fff; }
        .lfoot-domain {
          font-size: 11px; color: rgba(255,255,255,0.35);
          font-family: 'DM Sans',sans-serif;
        }
        .lfoot-copy {
          font-size: 11px; color: rgba(255,255,255,0.35);
          font-family: 'DM Sans',sans-serif;
        }
        .lfoot-right { display: flex; gap: 16px; }
        .lfoot-link {
          font-size: 11px; color: rgba(255,255,255,0.4);
          font-family: 'DM Sans',sans-serif;
          transition: color 0.15s;
        }
        .lfoot-link:hover { color: rgba(255,255,255,0.8); }
      `}</style>
      <footer className="lfoot">
        <div className="lfoot-left">
          <span className="lfoot-logo">LIVIN</span>
          <div className="lfoot-socials">
            {[['f','Facebook'],['in','LinkedIn'],['▶','YouTube'],['ig','Instagram']].map(([l,t]) => (
              <a key={l} href="#" className="lfoot-soc" title={t}>{l}</a>
            ))}
          </div>
          <span className="lfoot-domain">LivinSec.com</span>
        </div>
        <div className="lfoot-copy">© 2026 LIVIN. All Rights Reserved.</div>
        <div className="lfoot-right">
          <a href="#" className="lfoot-link">Business</a>
          <a href="#" className="lfoot-link">2,631</a>
          <a href="#" className="lfoot-link">% News</a>
        </div>
      </footer>
    </>
  )
}
