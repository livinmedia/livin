'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Login failed. Please try again.')
        setLoading(false)
        return
      }

      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const role = profile?.role || data.user.user_metadata?.role || 'user'

      // Route based on role
      if (role === 'super_admin' || role === 'admin') {
        window.location.href = '/dashboard/admin'
      } else if (role === 'market_mayor') {
        window.location.href = '/dashboard/mm'
      } else if (role === 'mvp') {
        window.location.href = '/dashboard/mvp'
      } else {
        window.location.href = '/dashboard/admin' // fallback
      }
    } catch (err) {
      setError('An unexpected error occurred.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif",
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #FFF8F0 0%, #FEF0E4 25%, #F0F4FF 60%, #EAF8F0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontFamily: "'Libre Caslon Display', Georgia, serif",
            fontSize: '36px', color: '#1a1a1a', marginBottom: '8px',
          }}>
            LIVIN
          </div>
          <p style={{ fontSize: '15px', fontWeight: 300, color: '#999' }}>
            Sign in to your dashboard
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: '#fff', borderRadius: '16px',
          border: '1px solid #EEEAE4', padding: '32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
        }}>
          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#999', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@livin.in"
                required
                style={{
                  width: '100%', padding: '12px 16px',
                  background: '#F9F7F3', border: '1px solid #EEEAE4',
                  borderRadius: '10px', fontSize: '14px', color: '#1a1a1a',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#999', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '12px 16px',
                  background: '#F9F7F3', border: '1px solid #EEEAE4',
                  borderRadius: '10px', fontSize: '14px', color: '#1a1a1a',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '10px 14px', background: '#FFF5ED',
                border: '1px solid #FDDCBB', borderRadius: '10px',
                fontSize: '13px', color: '#93400D', marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #FF8C3C, #E85D2A)',
                color: '#fff', border: 'none', borderRadius: '100px',
                fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(232,93,42,0.2)',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Quick access links */}
          <div style={{
            marginTop: '20px', paddingTop: '16px',
            borderTop: '1px solid #EEEAE4', textAlign: 'center',
          }}>
            <p style={{ fontSize: '12px', color: '#ccc', marginBottom: '8px' }}>
              Or go directly to a dashboard:
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: 'Admin', href: '/dashboard/admin', color: '#7C3AED', bg: '#F5F0FF' },
                { label: 'Market Mayor', href: '/dashboard/mm', color: '#E85D2A', bg: '#FFF5ED' },
                { label: 'Partner', href: '/dashboard/mvp', color: '#2D7DD2', bg: '#EFF6FF' },
              ].map(link => (
                <a key={link.label} href={link.href} style={{
                  padding: '5px 14px', background: link.bg,
                  borderRadius: '100px', fontSize: '11px',
                  fontWeight: 600, color: link.color, textDecoration: 'none',
                }}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a href="/" style={{ fontSize: '12px', color: '#999', textDecoration: 'none' }}>
            ← Back to livin.in
          </a>
        </div>
      </div>
    </div>
  )
}
