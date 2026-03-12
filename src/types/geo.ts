export interface Country {
  id: string
  slug: string
  name: string
}

export interface State {
  id: string
  slug: string
  name: string
  abbreviation: string
}

export interface City {
  id: string
  slug: string
  name: string
  state_region_id: string
  is_pilot: boolean
  has_market_mayor: boolean
}