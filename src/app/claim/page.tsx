'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Step = 'city' | 'features' | 'apply' | 'interview' | 'done'

export default function ClaimPage() {
  const [step, setStep] = useState<Step>('city')
  const [cities, setCities] = useState<any[]>([])
  const [selectedCity, setSelectedCity] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', license_number: '', license_state: '',
    brokerage: '', years_experience: '', annual_production: '', specialties: [] as string[],
    why_this_city: '', local_knowledge: '', marketing_experience: '', content_ideas: '',
    video_url: '', social_media: { instagram: '', linkedin: '', facebook: '' },
    referral_source: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [applicationId, setApplicationId] = useState<string | null>(null)

  // LIVI interview state
  const [messages, setMessages] = useState<Array<{ role: 'livi' | 'user'; text: string }>>([])
  const [userInput, setUserInput] = useState('')
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [interviewComplete, setInterviewComplete] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  // Preload from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const citySlug = params.get('city')

    async function loadCities() {
      const { data } = await supabase
        .from('cities')
        .select('id, name, slug, population, has_market_mayor, is_top_100, state_region_id, metadata')
        .eq('is_active', true)
        .order('name')
      setCities(data || [])

      if (citySlug && data) {
        const found = data.find(c => c.slug === citySlug)
        if (found) {
          setSelectedCity(found)
          setStep('features')
        }
      }
    }
    loadCities()
  }, [])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const filteredCities = cities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.has_market_mayor
  )

  const specialtyOptions = ['Residential', 'Luxury', 'Commercial', 'Investment', 'First-Time Buyers', 'Relocation', 'New Construction', 'Land', 'Condos', 'Multifamily']

  async function handleSubmitApplication() {
    if (!selectedCity || !form.full_name || !form.email || !form.license_number) return
    setSubmitting(true)

    const { data, error } = await supabase.from('mm_applications').insert({
      city_id: selectedCity.id,
      city_name: selectedCity.name,
      city_tier: selectedCity.is_top_100 ? 'top_100' : 'other',
      monthly_price: 1999,
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      license_number: form.license_number,
      license_state: form.license_state,
      brokerage: form.brokerage,
      years_experience: form.years_experience ? parseInt(form.years_experience) : null,
      annual_production: form.annual_production,
      specialties: form.specialties,
      why_this_city: form.why_this_city,
      local_knowledge: form.local_knowledge,
      marketing_experience: form.marketing_experience,
      content_ideas: form.content_ideas,
      video_url: form.video_url,
      social_media: form.social_media,
      referral_source: form.referral_source,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    }).select('id').single()

    if (data) {
      setApplicationId(data.id)
      setStep('interview')
      // Start LIVI interview
      startLiviInterview()
    }
    setSubmitting(false)
  }

  async function startLiviInterview() {
    const intro = `Hey ${form.full_name.split(' ')[0]}! I'm LIVI, the AI that powers the LIVIN network. Congrats on applying to become the Market Mayor for ${selectedCity?.name}. I have a few quick questions to learn more about you and your vision for this market. Ready?`
    setMessages([{ role: 'livi', text: intro }])
  }

  async function sendInterviewMessage() {
    if (!userInput.trim() || interviewLoading) return
    const newMessages = [...messages, { role: 'user' as const, text: userInput }]
    setMessages(newMessages)
    setUserInput('')
    setInterviewLoading(true)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are LIVI, the AI assistant for the LIVIN platform. You're interviewing a Market Mayor applicant named ${form.full_name} who wants to be the Market Mayor for ${selectedCity?.name}. They have ${form.years_experience || 'some'} years of experience, license #${form.license_number} in ${form.license_state}, and work at ${form.brokerage || 'their brokerage'}.

Your job is to have a friendly but substantive 5-question interview. Ask about:
1. Their specific knowledge of ${selectedCity?.name}'s neighborhoods and market trends
2. How they'd create content and engage the local community
3. Their experience with digital marketing and social media
4. Their vision for growing the LIVIN network in ${selectedCity?.name}
5. What makes them the right person for this role

Ask ONE question at a time. Be warm, conversational, and encouraging. Use their first name. After all 5 questions are answered, give a brief summary of what impressed you and tell them their application is under review. End with "Your interview is complete — we'll be in touch within 48 hours."

Keep responses under 3 sentences per message. Be concise and engaging.`,
          messages: newMessages.map(m => ({
            role: m.role === 'livi' ? 'assistant' : 'user',
            content: m.text,
          })),
        }),
      })

      const data = await response.json()
      const liviResponse = data.content?.[0]?.text || "Thanks for sharing that! Let me review your application — we'll be in touch soon."

      setMessages(prev => [...prev, { role: 'livi', text: liviResponse }])

      // Check if interview is complete
      if (liviResponse.includes('interview is complete') || liviResponse.includes("we'll be in touch")) {
        setInterviewComplete(true)
        // Save transcript to database
        if (applicationId) {
          await supabase.from('mm_applications').update({
            interview_transcript: [...newMessages, { role: 'livi', text: liviResponse }],
            interview_completed_at: new Date().toISOString(),
            status: 'interview_complete',
          }).eq('id', applicationId)
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'livi', text: "Thanks for sharing! I've noted your responses. Your application is under review — we'll be in touch within 48 hours." }])
      setInterviewComplete(true)
    }
    setInterviewLoading(false)
  }

  // ── Input helper ──
  function Input({ label, value, onChange, placeholder, type = 'text', required = false }: any) {
    return (
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#999', marginBottom: '6px' }}>
          {label} {required && <span style={{ color: '#E85D2A' }}>*</span>}
        </label>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
          style={{ width: '100%', padding: '12px 16px', background: '#F9F7F3', border: '1px solid #EEEAE4', borderRadius: '10px', fontSize: '14px', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = '#E85D2A'}
          onBlur={e => e.target.style.borderColor = '#EEEAE4'}
        />
      </div>
    )
  }

  function TextArea({ label, value, onChange, placeholder, rows = 3 }: any) {
    return (
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#999', marginBottom: '6px' }}>{label}</label>
        <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
          style={{ width: '100%', padding: '12px 16px', background: '#F9F7F3', border: '1px solid #EEEAE4', borderRadius: '10px', fontSize: '14px', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
          onFocus={e => e.target.style.borderColor = '#E85D2A'}
          onBlur={e => e.target.style.borderColor = '#EEEAE4'}
        />
      </div>
    )
  }

  return (
    <>
      <Nav />
      <div style={{
        fontFamily: "'Outfit', sans-serif",
        minHeight: '80vh',
        background: 'linear-gradient(160deg, #FFF8F0 0%, #FEF0E4 25%, #F0F4FF 60%, #EAF8F0 100%)',
        padding: 'clamp(32px, 5vw, 64px) 0',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>

          {/* ═══ STEP 1: City Selection ═══ */}
          {step === 'city' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#E85D2A', marginBottom: '10px' }}>
                  Become a Market Mayor
                </div>
                <h1 style={{ fontFamily: "'Libre Caslon Display', serif", fontSize: 'clamp(28px, 4vw, 42px)', color: '#1a1a1a', lineHeight: 1.1, marginBottom: '12px' }}>
                  Claim your city
                </h1>
                <p style={{ fontSize: '16px', fontWeight: 300, color: '#999', maxWidth: '480px', margin: '0 auto' }}>
                  Lead the LIVIN experience in your market. Be the trusted local expert, curate content, manage leads, and grow your business.
                </p>
              </div>

              {/* Search */}
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search for your city..."
                  style={{
                    width: '100%', padding: '16px 20px', background: '#fff',
                    border: '1px solid #EEEAE4', borderRadius: '14px',
                    fontSize: '16px', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  }}
                />
              </div>

              {/* City grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxHeight: '400px', overflow: 'auto' }}>
                {filteredCities.slice(0, 30).map(city => (
                  <button key={city.id} onClick={() => { setSelectedCity(city); setStep('features') }}
                    style={{
                      padding: '16px', background: '#fff', border: '1px solid #EEEAE4',
                      borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                      transition: 'border-color 0.2s, transform 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#E85D2A'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#EEEAE4'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}>{city.name}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {city.is_top_100 ? 'Top 100' : ''} {city.population ? `· ${(city.population / 1000).toFixed(0)}K` : ''}
                    </div>
                  </button>
                ))}
              </div>

              {filteredCities.length === 0 && searchQuery && (
                <div style={{ textAlign: 'center', padding: '32px', color: '#999', fontSize: '14px' }}>
                  No available cities match "{searchQuery}". All cities with Market Mayors are taken.
                </div>
              )}
            </>
          )}

          {/* ═══ STEP 2: Features + Pricing ═══ */}
          {step === 'features' && selectedCity && (
            <>
              <button onClick={() => setStep('city')} style={{ background: 'none', border: 'none', fontSize: '13px', color: '#999', cursor: 'pointer', marginBottom: '20px' }}>
                ← Choose a different city
              </button>

              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#E85D2A', marginBottom: '10px' }}>
                  Market Mayor — {selectedCity.name}
                </div>
                <h2 style={{ fontFamily: "'Libre Caslon Display', serif", fontSize: '32px', color: '#1a1a1a', marginBottom: '8px' }}>
                  $1,999<span style={{ fontSize: '16px', fontWeight: 300, color: '#999' }}>/month</span>
                </h2>
                <p style={{ fontSize: '14px', fontWeight: 300, color: '#999' }}>
                  Top 100 US city exclusive territory
                </p>
              </div>

              {/* Features */}
              <div style={{
                background: '#fff', borderRadius: '16px', border: '1px solid #EEEAE4',
                padding: '32px', marginBottom: '24px',
              }}>
                <h3 style={{ fontFamily: "'Libre Caslon Display', serif", fontSize: '20px', color: '#1a1a1a', marginBottom: '20px' }}>
                  What you get as Market Mayor
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {[
                    { icon: '◉', title: 'Exclusive city territory', desc: `You are THE real estate expert for ${selectedCity.name} on LIVIN. No competition.` },
                    { icon: '✎', title: 'AI-generated content', desc: 'LIVI creates 5+ articles per week for your city — neighborhood guides, market reports, lifestyle content.' },
                    { icon: '♥', title: 'Qualified lead routing', desc: 'Every buyer, seller, and relocator lead from your city routes directly to you.' },
                    { icon: '⊕', title: 'Local partner network', desc: 'Recruit restaurants, gyms, salons as Market Vendor Partners. Earn revenue share on their ad placements.' },
                    { icon: '◎', title: 'City dashboard', desc: 'Real-time analytics, lead management, content approval queue, and community board.' },
                    { icon: '★', title: 'Featured profile', desc: 'Your name, license, bio, and contact on every city page and article. Be the face of the market.' },
                    { icon: '▪', title: 'Property listings', desc: 'Feature your listings on the city page with lead capture forms and agent attribution.' },
                    { icon: '〰', title: 'Community leader', desc: 'Private community board for your city where you connect with local businesses and residents.' },
                  ].map(f => (
                    <div key={f.title} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '18px', color: '#E85D2A', flexShrink: 0, marginTop: '2px' }}>{f.icon}</span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '3px' }}>{f.title}</div>
                        <div style={{ fontSize: '12px', fontWeight: 300, color: '#999', lineHeight: 1.4 }}>{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What we're looking for */}
              <div style={{
                background: '#fff', borderRadius: '16px', border: '1px solid #EEEAE4',
                padding: '24px', marginBottom: '24px',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginBottom: '12px' }}>
                  What we look for in a Market Mayor
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    'Active real estate license', 'Deep local market knowledge',
                    'Strong community connections', 'Digital marketing experience',
                    'Content creation mindset', 'Minimum 2 years experience',
                    'Social media presence', 'Growth-oriented mindset',
                  ].map(req => (
                    <div key={req} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#666' }}>
                      <span style={{ color: '#22C580', fontSize: '14px' }}>✓</span> {req}
                    </div>
                  ))}
                </div>
              </div>

              {/* Process */}
              <div style={{
                background: '#FFF5ED', borderRadius: '16px', border: '1px solid #FDDCBB',
                padding: '24px', marginBottom: '32px',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#93400D', marginBottom: '12px' }}>
                  The application process
                </h3>
                <div style={{ display: 'flex', gap: '20px' }}>
                  {['Fill out application', 'Interview with LIVI (AI)', 'Team review', 'Approval + onboarding'].map((s, i) => (
                    <div key={s} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#93400D' }}>
                      <span style={{
                        width: '24px', height: '24px', borderRadius: '50%', background: '#E85D2A',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>{i + 1}</span>
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <button onClick={() => setStep('apply')}
                  style={{
                    padding: '16px 40px', background: 'linear-gradient(135deg, #FF8C3C, #E85D2A)',
                    color: '#fff', border: 'none', borderRadius: '100px',
                    fontSize: '16px', fontWeight: 600, cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(232,93,42,0.25)',
                  }}
                >
                  Apply for {selectedCity.name} →
                </button>
              </div>
            </>
          )}

          {/* ═══ STEP 3: Application Form ═══ */}
          {step === 'apply' && selectedCity && (
            <>
              <button onClick={() => setStep('features')} style={{ background: 'none', border: 'none', fontSize: '13px', color: '#999', cursor: 'pointer', marginBottom: '20px' }}>
                ← Back to features
              </button>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#E85D2A', marginBottom: '8px' }}>
                  Step 1 of 2
                </div>
                <h2 style={{ fontFamily: "'Libre Caslon Display', serif", fontSize: '28px', color: '#1a1a1a', marginBottom: '6px' }}>
                  Your application
                </h2>
                <p style={{ fontSize: '14px', fontWeight: 300, color: '#999' }}>
                  Market Mayor for {selectedCity.name} · $1,999/mo
                </p>
              </div>

              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EEEAE4', padding: '32px' }}>
                {/* Personal info */}
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '14px' }}>Personal information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <Input label="Full name" value={form.full_name} onChange={(e: any) => setForm({ ...form, full_name: e.target.value })} placeholder="Your full name" required />
                  <Input label="Email" value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" type="email" required />
                  <Input label="Phone" value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
                  <Input label="Referral source" value={form.referral_source} onChange={(e: any) => setForm({ ...form, referral_source: e.target.value })} placeholder="How did you hear about LIVIN?" />
                </div>

                <div style={{ height: '1px', background: '#EEEAE4', margin: '20px 0' }} />

                {/* License info */}
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '14px' }}>Real estate credentials</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <Input label="License number" value={form.license_number} onChange={(e: any) => setForm({ ...form, license_number: e.target.value })} placeholder="Your license #" required />
                  <Input label="License state" value={form.license_state} onChange={(e: any) => setForm({ ...form, license_state: e.target.value })} placeholder="TX" required />
                  <Input label="Brokerage" value={form.brokerage} onChange={(e: any) => setForm({ ...form, brokerage: e.target.value })} placeholder="Your brokerage name" />
                  <Input label="Years of experience" value={form.years_experience} onChange={(e: any) => setForm({ ...form, years_experience: e.target.value })} placeholder="5" type="number" />
                </div>
                <Input label="Annual production volume" value={form.annual_production} onChange={(e: any) => setForm({ ...form, annual_production: e.target.value })} placeholder="e.g. $5M, 20 transactions" />

                {/* Specialties */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#999', marginBottom: '8px' }}>Specialties</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {specialtyOptions.map(s => {
                      const selected = form.specialties.includes(s)
                      return (
                        <button key={s}
                          onClick={() => setForm({ ...form, specialties: selected ? form.specialties.filter(x => x !== s) : [...form.specialties, s] })}
                          style={{
                            padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                            background: selected ? '#FFF5ED' : '#F9F7F3', color: selected ? '#E85D2A' : '#999',
                            border: selected ? '1px solid #FDDCBB' : '1px solid #EEEAE4',
                          }}
                        >{s}</button>
                      )
                    })}
                  </div>
                </div>

                <div style={{ height: '1px', background: '#EEEAE4', margin: '20px 0' }} />

                {/* Open-ended questions */}
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '14px' }}>Tell us about you</h3>
                <TextArea label="Why this city?" value={form.why_this_city} onChange={(e: any) => setForm({ ...form, why_this_city: e.target.value })} placeholder={`Why are you the right Market Mayor for ${selectedCity.name}?`} />
                <TextArea label="Local market knowledge" value={form.local_knowledge} onChange={(e: any) => setForm({ ...form, local_knowledge: e.target.value })} placeholder="Describe your knowledge of the neighborhoods, trends, and community..." />
                <TextArea label="Digital marketing experience" value={form.marketing_experience} onChange={(e: any) => setForm({ ...form, marketing_experience: e.target.value })} placeholder="How do you market yourself and your listings online?" />
                <TextArea label="Content ideas for your city" value={form.content_ideas} onChange={(e: any) => setForm({ ...form, content_ideas: e.target.value })} placeholder="What kind of content would you create for your city page?" />
                <Input label="Video introduction URL (optional)" value={form.video_url} onChange={(e: any) => setForm({ ...form, video_url: e.target.value })} placeholder="Link to a short video about yourself" />

                <div style={{ height: '1px', background: '#EEEAE4', margin: '20px 0' }} />

                {/* Social media */}
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '14px' }}>Social media</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
                  <Input label="Instagram" value={form.social_media.instagram} onChange={(e: any) => setForm({ ...form, social_media: { ...form.social_media, instagram: e.target.value } })} placeholder="@handle" />
                  <Input label="LinkedIn" value={form.social_media.linkedin} onChange={(e: any) => setForm({ ...form, social_media: { ...form.social_media, linkedin: e.target.value } })} placeholder="Profile URL" />
                  <Input label="Facebook" value={form.social_media.facebook} onChange={(e: any) => setForm({ ...form, social_media: { ...form.social_media, facebook: e.target.value } })} placeholder="Page URL" />
                </div>

                <button onClick={handleSubmitApplication} disabled={submitting || !form.full_name || !form.email || !form.license_number}
                  style={{
                    width: '100%', padding: '16px', marginTop: '16px',
                    background: (submitting || !form.full_name || !form.email || !form.license_number) ? '#ddd' : 'linear-gradient(135deg, #FF8C3C, #E85D2A)',
                    color: '#fff', border: 'none', borderRadius: '100px',
                    fontSize: '16px', fontWeight: 600,
                    cursor: (submitting || !form.full_name || !form.email || !form.license_number) ? 'not-allowed' : 'pointer',
                    boxShadow: submitting ? 'none' : '0 4px 20px rgba(232,93,42,0.25)',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit & Start LIVI Interview →'}
                </button>
              </div>
            </>
          )}

          {/* ═══ STEP 4: LIVI Interview ═══ */}
          {step === 'interview' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#E85D2A', marginBottom: '8px' }}>
                  Step 2 of 2
                </div>
                <h2 style={{ fontFamily: "'Libre Caslon Display', serif", fontSize: '28px', color: '#1a1a1a', marginBottom: '6px' }}>
                  Interview with LIVI
                </h2>
                <p style={{ fontSize: '14px', fontWeight: 300, color: '#999' }}>
                  Our AI will ask you a few questions about your market expertise
                </p>
              </div>

              <div style={{
                background: '#fff', borderRadius: '16px', border: '1px solid #EEEAE4',
                overflow: 'hidden',
              }}>
                {/* Chat area */}
                <div ref={chatRef} style={{ height: '400px', overflow: 'auto', padding: '24px' }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: '10px', marginBottom: '16px',
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    }}>
                      {msg.role === 'livi' && (
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #FF8C3C, #E85D2A)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', color: '#fff', fontWeight: 700, flexShrink: 0,
                        }}>L</div>
                      )}
                      <div style={{
                        maxWidth: '70%', padding: '12px 16px',
                        borderRadius: msg.role === 'livi' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                        background: msg.role === 'livi' ? '#F9F7F3' : '#E85D2A',
                        color: msg.role === 'livi' ? '#1a1a1a' : '#fff',
                        fontSize: '14px', lineHeight: 1.5,
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {interviewLoading && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF8C3C, #E85D2A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', fontWeight: 700, flexShrink: 0 }}>L</div>
                      <div style={{ padding: '12px 16px', background: '#F9F7F3', borderRadius: '4px 16px 16px 16px', fontSize: '14px', color: '#999' }}>LIVI is thinking...</div>
                    </div>
                  )}
                </div>

                {/* Input */}
                {!interviewComplete ? (
                  <div style={{ display: 'flex', gap: '8px', padding: '16px', borderTop: '1px solid #EEEAE4' }}>
                    <input value={userInput} onChange={e => setUserInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendInterviewMessage()}
                      placeholder="Type your response..."
                      style={{ flex: 1, padding: '12px 16px', background: '#F9F7F3', border: '1px solid #EEEAE4', borderRadius: '100px', fontSize: '14px', color: '#1a1a1a', outline: 'none' }}
                    />
                    <button onClick={sendInterviewMessage} disabled={interviewLoading || !userInput.trim()}
                      style={{
                        padding: '12px 24px', background: interviewLoading ? '#ddd' : '#E85D2A',
                        color: '#fff', border: 'none', borderRadius: '100px',
                        fontSize: '14px', fontWeight: 600, cursor: interviewLoading ? 'not-allowed' : 'pointer',
                      }}
                    >Send</button>
                  </div>
                ) : (
                  <div style={{ padding: '16px', borderTop: '1px solid #EEEAE4', textAlign: 'center' }}>
                    <button onClick={() => setStep('done')}
                      style={{
                        padding: '14px 32px', background: 'linear-gradient(135deg, #FF8C3C, #E85D2A)',
                        color: '#fff', border: 'none', borderRadius: '100px',
                        fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >Complete application →</button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══ STEP 5: Done ═══ */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: '#ECFDF5', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 20px',
                fontSize: '28px', color: '#22C580',
              }}>✓</div>
              <h2 style={{ fontFamily: "'Libre Caslon Display', serif", fontSize: '32px', color: '#1a1a1a', marginBottom: '12px' }}>
                Application submitted
              </h2>
              <p style={{ fontSize: '16px', fontWeight: 300, color: '#999', maxWidth: '400px', margin: '0 auto 24px' }}>
                Thank you, {form.full_name.split(' ')[0]}! Your application for Market Mayor in {selectedCity?.name} is under review. We will be in touch within 48 hours.
              </p>
              <div style={{
                background: '#fff', borderRadius: '14px', border: '1px solid #EEEAE4',
                padding: '20px', maxWidth: '320px', margin: '0 auto 24px',
              }}>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px' }}>Application details</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a1a', marginBottom: '4px' }}>{selectedCity?.name} Market Mayor</div>
                <div style={{ fontSize: '13px', color: '#E85D2A', fontWeight: 600 }}>$1,999/month</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>Status: Under review</div>
              </div>
              <a href="/" style={{
                padding: '14px 32px', background: '#1a1a1a', color: '#fff',
                borderRadius: '100px', fontSize: '15px', fontWeight: 500,
                textDecoration: 'none', display: 'inline-block',
              }}>
                Back to LIVIN →
              </a>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  )
}
