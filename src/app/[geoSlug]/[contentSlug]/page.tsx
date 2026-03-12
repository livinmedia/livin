import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Script from 'next/script'
import { getPublishedArticle, getAllPublishedSlugs } from '@/lib/content'
import { ContentBody } from '@/components/ContentBody'

const BRAND = (process.env.NEXT_PUBLIC_BRAND ?? 'livin') as 'livin' | 'homes_and_livin'

export const revalidate = 3600

interface PageParams {
  geoSlug: string
  contentSlug: string
}

export async function generateStaticParams(): Promise<PageParams[]> {
  const slugs = await getAllPublishedSlugs(BRAND)
  return slugs.map((s) => ({ geoSlug: s.geoSlug, contentSlug: s.contentSlug }))
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { geoSlug, contentSlug } = await params
  const record = await getPublishedArticle(geoSlug, contentSlug)
  if (!record) return { title: 'Not Found', robots: { index: false, follow: false } }
  const title = record.og_title ?? record.title
  const description = record.meta_description ?? undefined
  const cityName = record.cities?.name ?? geoSlug
  const stateAbbr = record.cities?.states_regions?.abbreviation ?? ''
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(record.og_image_url && { images: [{ url: record.og_image_url, width: 1200, height: 630, alt: title }] }),
      type: 'article',
      ...(record.published_at && { publishedTime: record.published_at }),
      modifiedTime: record.updated_at,
    },
    alternates: {
      canonical: BRAND === 'livin'
        ? `https://livin.in/${geoSlug}/${contentSlug}`
        : `https://homesandlivin.in/${geoSlug}/${contentSlug}`,
    },
    robots: { index: true, follow: true },
    other: { 'geo.region': `US-${stateAbbr}`, 'geo.placename': `${cityName}, ${stateAbbr}` },
  }
}

export default async function ArticlePage({ params }: { params: Promise<PageParams> }) {
  const { geoSlug, contentSlug } = await params
  const record = await getPublishedArticle(geoSlug, contentSlug)
  if (!record || !record.body_json) notFound()
  const cityName = record.cities?.name ?? geoSlug
  const stateAbbr = record.cities?.states_regions?.abbreviation ?? ''
  return (
    <>
      {record.schema_json && (
        <Script
          id={`schema-${record.id}`}
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(record.schema_json) }}
        />
      )}
      <main className="article-page">
        <nav className="article-breadcrumb" aria-label="breadcrumb">
          <a href={`/${geoSlug}`}>{cityName}{stateAbbr ? `, ${stateAbbr}` : ''}</a>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{record.title}</span>
        </nav>
        <ContentBody body={record.body_json} citySlug={geoSlug} brand={BRAND} />
        {record.published_at && (
          <time className="article-published-at sr-only" dateTime={record.published_at}>
            Published {new Date(record.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
        )}
      </main>
    </>
  )
}