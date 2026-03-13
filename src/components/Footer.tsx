export default function Footer() {
  return (
    <footer style={{
      padding: '40px clamp(24px, 4vw, 80px) 24px',
      background: 'var(--lv-white)',
      borderTop: '1px solid var(--lv-border)',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr',
        gap: '32px',
        marginBottom: '32px',
        maxWidth: '1320px',
        margin: '0 auto 32px',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            color: 'var(--lv-black)',
            marginBottom: '8px',
          }}>
            LIVIN
          </div>
          <p style={{
            fontSize: '13px',
            fontWeight: 300,
            color: 'var(--lv-text-light)',
            lineHeight: 1.6,
            maxWidth: '240px',
          }}>
            The global discovery platform for cities, lifestyle, and place.
          </p>
        </div>
        <FooterCol title="Explore" links={['All cities', 'Lifestyle', 'Real estate', 'Hidden gems']} />
        <FooterCol title="Platform" links={['About LIVIN', 'For businesses', 'Partnerships']} />
        <FooterCol title="Legal" links={['Privacy', 'Terms', 'Contact']} />
      </div>

      <div style={{
        borderTop: '1px solid var(--lv-border)',
        paddingTop: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1320px',
        margin: '0 auto',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--lv-text-light)' }}>
          © {new Date().getFullYear()} LIVIN. All rights reserved.
        </span>
        <span style={{ fontSize: '11px', color: 'var(--lv-text-light)' }}>
          livin.in
        </span>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div style={{
        fontSize: '10px',
        fontWeight: 700,
        color: 'var(--lv-text-light)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: '14px',
      }}>
        {title}
      </div>
      {links.map(link => (
        <a key={link} href="#" style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 400,
          color: 'var(--lv-text-muted)',
          marginBottom: '8px',
        }}>
          {link}
        </a>
      ))}
    </div>
  )
}
