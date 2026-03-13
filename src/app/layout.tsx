import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LIVIN — Discover Where You Belong',
  description: 'The global discovery platform for cities, lifestyle, and place. Explore where and how you want to live.',
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
