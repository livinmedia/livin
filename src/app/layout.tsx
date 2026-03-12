// ============================================================
// LIVIN Platform — Root Layout
// P0-025: App Router File Structure
// Doc 2: Section 4.3
// ============================================================
// Single layout serving both livin.in and homesandlivin.in.
// Brand context is read from the x-brand header set by middleware.
// ============================================================

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Inter } from 'next/font/google'
import './globals.css'
import { Brand } from '@/lib/routing/brand-context'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const brand = headersList.get('x-brand') as Brand | null

  const isHL = brand === Brand.HOMES_AND_LIVIN

  return {
    // Brand-aware default metadata — overridden by each page
    title: {
      default: isHL ? 'Homes & Livin' : 'LIVIN',
      template: isHL ? '%s | Homes & Livin' : '%s | LIVIN',
    },
    description: isHL
      ? 'Find homes, connect with local agents, and explore real estate in your city.'
      : 'Discover the best of city living — food, culture, neighborhoods, and lifestyle.',
    // Robots: index everything by default
    robots: { index: true, follow: true },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const brand = (headersList.get('x-brand') as Brand) || Brand.LIVIN
  const isHL = brand === Brand.HOMES_AND_LIVIN

  return (
    <html lang="en" data-brand={brand}>
      <body className={inter.className} data-brand={brand}>
        {/* Nav and footer are handled per-page for brand-aware design */}
        <main>{children}</main>
      </body>
    </html>
  )
}
