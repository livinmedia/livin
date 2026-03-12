export type BrandName = 'livin' | 'homes_and_livin'

export interface BrandContext {
  brand: BrandName
  hostname: string
  subdomain: string | null
}