/**
 * P0-035 — ContentBody Component
 * Renders the body_json structure from content_records.
 *
 * body_json shape (per Doc09 Section 7.2):
 * {
 *   h1: string,
 *   sections: [{ h2, paragraphs: [string], internal_links: [{ anchor, href }] }],
 *   conclusion: string
 * }
 *
 * This is a React Server Component — no 'use client' directive.
 */

import type { BodyJson } from '@/types/content'

interface ContentBodyProps {
  body: BodyJson
  citySlug: string
  brand: 'livin' | 'homes_and_livin'
}

export function ContentBody({ body, citySlug, brand }: ContentBodyProps) {
  const basePath = brand === 'livin'
    ? `https://livin.in/${citySlug}`
    : `https://homesandlivin.in/${citySlug}`

  return (
    <article className="content-body prose prose-lg max-w-none">
      {/* H1 — primary heading from content_records.h1 */}
      <h1 className="content-h1">{body.h1}</h1>

      {/* Sections — each maps to H2 + paragraphs + internal links */}
      {body.sections.map((section, sectionIdx) => (
        <section key={sectionIdx} className="content-section">
          <h2 className="content-h2">{section.h2}</h2>

          {section.paragraphs.map((paragraph, paraIdx) => (
            <p key={paraIdx} className="content-paragraph">
              {paragraph}
            </p>
          ))}

          {/* Internal link hooks — injected by Internal Linking Agent */}
          {section.internal_links && section.internal_links.length > 0 && (
            <div className="content-internal-links">
              {section.internal_links.map((link, linkIdx) => {
                // Ensure link is root-relative or absolute within the brand domain
                const href = link.href.startsWith('http')
                  ? link.href
                  : `${basePath}/${link.href.replace(/^\//, '')}`
                return (
                  <a key={linkIdx} href={href} className="content-internal-link">
                    {link.anchor}
                  </a>
                )
              })}
            </div>
          )}
        </section>
      ))}

      {/* Conclusion paragraph */}
      {body.conclusion && (
        <p className="content-conclusion">{body.conclusion}</p>
      )}
    </article>
  )
}
