'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ClaimPage() {
  const [states, setStates] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', license: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  // Check URL params for direct linking from city pages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const citySlug = params.get('city')
    if (citySlug) {
      loadCityDirect(citySlug)
    }
    loadStates()
  }, [])

  async function loadStates() {
    const { data } = await supabase
      .from('states_regions')
      .select('id, name, abbreviation, slug')
      .eq('is_active', true)
      .order('name')
    setStates(data || [])
    setLoading(false)
  }

  async function loadCityDirect(slug: string) {
    const { data: city } = await supabase
      .from('cities')
      .select('id, name, slug, population, has_market_mayor, state_region_id, metadata')
      .eq('slug', slug)
      .single()
    if (city) {
      setSelectedCity(city)
      const { data: state } = await supabase
        .from('states_regions')
        .select('id, name, abbreviation')
        .eq('id', city.state_region_id)
        .single()
      if (state) setSelectedState(state.id)
    }
  }

  async function selectState(stateId: string) {
    setSelectedState(stateId)
    setSelectedCity(null)
    const { data } = await supabase
      .from('cities')
      .select('id, name, slug, population, has_market_mayor, state_region_id, metadata')
      .eq('state_region_id', stateId)
      .eq('is_active', true)
      .order('name')
    setCities(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCity) return

    // Insert as a lead with type 'general' and intent for MM application
    await supabase.from('leads').insert({
      city_id: selectedCity.id,
      source_brand: 'livin',
      destination_brand: 'homes_and_livin',
      lead_type: 'general',
      contact_name: formData.name,
      contact_email: formData.email,
      contact_phone: formData.phone,
      status: 'new',
      quality_score: 8,
      intent_signals: {
        type: 'mm_application',
        license_number: formData.license,
        message: formData.message,
        city_slug: selectedCity.slug,
        city_name: selectedCity.name,
      },
      source_url: window.location.href,
    })

    setSubmitted(true)
  }

  const selectedStateName = states.find(s => s.id === selectedState)?.name || ''
  const selectedStateAbbr = states.find(s => s.id === selectedState)?.abbreviation || ''

  return (
    <>
      <Nav />

      {/* Hero */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        padding: 'clamp(48px, 6vw, 80px) 0 clamp(40px, 5vw, 60px)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'var(--lv-warm-bg)', opacity: 0.5,
        }} />
        <div className="lv-container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', padding: '5px 16px',
            background: '#fff', border: '1px solid var(--lv-border)',
            borderRadius: 'var(--radius-pill)', marginBottom: '20px',
            fontSize: '12px', fontWeight: 600, color: 'var(--lv-orange)',
          }}>
            103 cities available
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 4.5vw, 52px)',
            color: 'var(--lv-black)', lineHeight: 1.08,
            letterSpacing: '-0.03em', marginBottom: '14px',
          }}>
            Claim your{' '}
            <span style={{
              fontStyle: 'italic',
              background: 'var(--lv-orange-grad)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>city</span>
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 1.8vw, 18px)', fontWeight: 300,
            color: 'var(--lv-text-muted)', lineHeight: 1.6,
            maxWidth: '520px', margin: '0 auto',
          }}>
            Become a LIVIN Market Mayor — the licensed real estate professional who leads
            your city on the platform. Select your state, choose your city, and apply.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section style={{ padding: 'clamp(24px, 4vw, 48px) 0 clamp(48px, 6vw, 80px)', background: 'var(--lv-white)' }}>
        <div className="lv-container">
          {submitted ? (
            /* Success state */
            <div style={{
              maxWidth: '520px', margin: '0 auto', textAlign: 'center',
              padding: '48px 32px', background: 'var(--lv-cream)',
              borderRadius: '18px',
            }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #22C580, #2AB7A9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: '28px', color: '#fff',
              }}>✓</div>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: '28px',
                color: 'var(--lv-black)', marginBottom: '10px',
              }}>Application submitted</h2>
              <p style={{ fontSize: '15px', color: 'var(--lv-text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
                Thank you for applying to be the Market Mayor of {selectedCity?.name}.
                We will review your application and get back to you within 48 hours.
              </p>
              <a href="/" style={{
                display: 'inline-flex', padding: '12px 28px',
                background: 'var(--lv-orange-grad)', color: '#fff',
                borderRadius: 'var(--radius-pill)', fontSize: '15px', fontWeight: 600,
                textDecoration: 'none',
              }}>
                Back to LIVIN →
              </a>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'flex-start' }}>
              {/* Left — State & City selection */}
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-display)', fontSize: '22px',
                  color: 'var(--lv-black)', marginBottom: '16px',
                }}>
                  {!selectedState ? 'Select your state' : !selectedCity ? `Cities in ${selectedStateName}` : 'Your city'}
                </h2>

                {/* State grid */}
                {!selectedState && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {states.map(state => (
                      <button key={state.id} onClick={() => selectState(state.id)} style={{
                        padding: '12px 14px', background: '#fff',
                        border: '1px solid var(--lv-border)', borderRadius: '12px',
                        textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.2s',
                        fontSize: '14px', fontWeight: 500, color: 'var(--lv-black)',
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--lv-orange)', marginRight: '6px' }}>
                          {state.abbreviation}
                        </span>
                        {state.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* City list for selected state */}
                {selectedState && !selectedCity && (
                  <>
                    <button onClick={() => { setSelectedState(null); setCities([]) }} style={{
                      padding: '6px 14px', background: 'var(--lv-cream)',
                      border: 'none', borderRadius: 'var(--radius-pill)',
                      fontSize: '12px', color: 'var(--lv-text-muted)', cursor: 'pointer',
                      marginBottom: '14px',
                    }}>
                      ← Back to states
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {cities.map(city => (
                        <button key={city.id} onClick={() => !city.has_market_mayor && setSelectedCity(city)} style={{
                          padding: '16px 18px', background: '#fff',
                          border: `1px solid ${city.has_market_mayor ? '#A7F3D0' : 'var(--lv-border)'}`,
                          borderRadius: '14px', textAlign: 'left',
                          cursor: city.has_market_mayor ? 'not-allowed' : 'pointer',
                          opacity: city.has_market_mayor ? 0.7 : 1,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--lv-black)', marginBottom: '2px' }}>
                              {city.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--lv-text-muted)' }}>
                              {city.population ? `Pop. ${city.population.toLocaleString()}` : selectedStateName}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '11px', fontWeight: 600, padding: '4px 14px',
                            borderRadius: 'var(--radius-pill)',
                            background: city.has_market_mayor ? '#ECFDF5' : '#FFF5ED',
                            color: city.has_market_mayor ? '#22C580' : '#E85D2A',
                          }}>
                            {city.has_market_mayor ? 'Claimed' : 'Available'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Selected city confirmation */}
                {selectedCity && (
                  <>
                    <button onClick={() => setSelectedCity(null)} style={{
                      padding: '6px 14px', background: 'var(--lv-cream)',
                      border: 'none', borderRadius: 'var(--radius-pill)',
                      fontSize: '12px', color: 'var(--lv-text-muted)', cursor: 'pointer',
                      marginBottom: '14px',
                    }}>
                      ← Choose different city
                    </button>
                    <div style={{
                      padding: '24px', background: 'var(--lv-cream)',
                      borderRadius: '16px', border: '1px solid var(--lv-border)',
                    }}>
                      <div style={{
                        height: '120px', borderRadius: '12px', marginBottom: '16px',
                        background: selectedCity.metadata?.hero_image_url
                          ? `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.4) 100%), url(${selectedCity.metadata.hero_image_url}) center/cover`
                          : 'linear-gradient(135deg, #FF9A5C, #E85D2A)',
                        display: 'flex', alignItems: 'flex-end', padding: '14px',
                      }}>
                        <div style={{
                          fontFamily: 'var(--font-display)', fontSize: '24px', color: '#fff',
                        }}>
                          {selectedCity.name}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ textAlign: 'center', padding: '12px', background: '#fff', borderRadius: '10px' }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--lv-black)' }}>
                            {selectedCity.population ? selectedCity.population.toLocaleString() : '—'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--lv-text-muted)' }}>Population</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '12px', background: '#fff', borderRadius: '10px' }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#E85D2A' }}>Open</div>
                          <div style={{ fontSize: '11px', color: 'var(--lv-text-muted)' }}>MM Status</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Right — Application form */}
              <div style={{
                padding: '28px', background: '#fff',
                border: '1px solid var(--lv-border)', borderRadius: '18px',
                position: 'sticky', top: '80px',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lv-orange)', marginBottom: '8px' }}>
                  Apply as Market Mayor
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display)', fontSize: '20px',
                  color: 'var(--lv-black)', marginBottom: '6px',
                }}>
                  {selectedCity ? `Lead ${selectedCity.name}` : 'Select a city to apply'}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--lv-text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
                  Market Mayors are licensed real estate professionals who curate the LIVIN experience for their city.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" placeholder="Full name" required value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      padding: '14px 18px', background: 'var(--lv-cream)',
                      border: '1px solid var(--lv-border)', borderRadius: '12px',
                      fontSize: '14px', color: 'var(--lv-black)', outline: 'none',
                    }}
                  />
                  <input type="email" placeholder="Email" required value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      padding: '14px 18px', background: 'var(--lv-cream)',
                      border: '1px solid var(--lv-border)', borderRadius: '12px',
                      fontSize: '14px', color: 'var(--lv-black)', outline: 'none',
                    }}
                  />
                  <input type="tel" placeholder="Phone" value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      padding: '14px 18px', background: 'var(--lv-cream)',
                      border: '1px solid var(--lv-border)', borderRadius: '12px',
                      fontSize: '14px', color: 'var(--lv-black)', outline: 'none',
                    }}
                  />
                  <input type="text" placeholder="Real estate license #" value={formData.license}
                    onChange={e => setFormData({ ...formData, license: e.target.value })}
                    style={{
                      padding: '14px 18px', background: 'var(--lv-cream)',
                      border: '1px solid var(--lv-border)', borderRadius: '12px',
                      fontSize: '14px', color: 'var(--lv-black)', outline: 'none',
                    }}
                  />
                  <textarea placeholder="Why do you want to lead this city?" rows={3} value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    style={{
                      padding: '14px 18px', background: 'var(--lv-cream)',
                      border: '1px solid var(--lv-border)', borderRadius: '12px',
                      fontSize: '14px', color: 'var(--lv-black)', outline: 'none',
                      resize: 'vertical', fontFamily: 'var(--font-body)',
                    }}
                  />
                  <button type="submit" disabled={!selectedCity} style={{
                    padding: '16px',
                    background: selectedCity ? 'linear-gradient(135deg, #FF8C3C, #E85D2A)' : '#ddd',
                    color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)',
                    fontSize: '16px', fontWeight: 600,
                    cursor: selectedCity ? 'pointer' : 'not-allowed',
                    boxShadow: selectedCity ? '0 4px 20px rgba(232,93,42,0.25)' : 'none',
                  }}>
                    {selectedCity ? `Apply for ${selectedCity.name} →` : 'Select a city first'}
                  </button>
                </form>

                <p style={{ fontSize: '11px', color: 'var(--lv-text-light)', marginTop: '12px', lineHeight: 1.4, textAlign: 'center' }}>
                  By applying, you agree to the LIVIN Market Mayor terms. We review all applications within 48 hours.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}
