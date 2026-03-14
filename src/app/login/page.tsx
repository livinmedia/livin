'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
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
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        // Fallback to user metadata if profile query fails
        const role = data.user.user_metadata?.role || 'user'
        routeByRole(role)
        return
      }

      routeByRole(profile?.role || 'user')
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  function routeByRole(role: string) {
    if (role === 'super_admin' || role === 'admin') {
      window.location.href = '/dashboard/admin'
    } else if (role === 'market_mayor') {
      window.location.href = '/dashboard/mm'
    } else if (role === 'mvp') {
      window.location.href = '/dashboard/mvp'
    } else {
      window.location.href = '/dashboard/admin'
    }
  }

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif",
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #FFF8F0 0%, #FEF0E4 25%, #F0F4FF 60%, #EAF8F0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '0 24px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontFamily: "'Libre Caslon Display', Georgia, serif",
            fontSize: '40px', color: '#1a1a1a', marginBottom: '8px',
          }}>
            LIVIN
          </div>
          <p style={{ fontSize: '16px', fontWeight: 300, color: '#999' }}>
            Sign in to your dashboard
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: '#fff', borderRadius: '18px',
          border: '1px solid #EEEAE4', padding: '36px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
        }}>
          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: 500,
                color: '#999', marginBottom: '8px', letterSpacing: '0.04em',
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@livin.in"
                required
                style={{
                  width: '100%', padding: '14px 18px',
                  background: '#F9F7F3', border: '1px solid #EEEAE4',
                  borderRadius: '12px', fontSize: '15px', color: '#1a1a1a',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#E85D2A'}
                onBlur={e => e.target.style.borderColor = '#EEEAE4'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: 500,
                color: '#999', marginBottom: '8px', letterSpacing: '0.04em',
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                style={{
                  width: '100%', padding: '14px 18px',
                  background: '#F9F7F3', border: '1px solid #EEEAE4',
                  borderRadius: '12px', fontSize: '15px', color: '#1a1a1a',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#E85D2A'}
                onBlur={e => e.target.style.borderColor = '#EEEAE4'}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '12px 16px', background: '#FFF5ED',
                border: '1px solid #FDDCBB', borderRadius: '12px',
                fontSize: '13px', color: '#93400D', marginBottom: '18px',
                lineHeight: 1.4,
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '16px',
                background: loading ? '#ddd' : 'linear-gradient(135deg, #FF8C3C, #E85D2A)',
                color: '#fff', border: 'none', borderRadius: '100px',
                fontSize: '16px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(232,93,42,0.25)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <a href="/" style={{
            fontSize: '13px', color: '#999', textDecoration: 'none',
            fontWeight: 400,
          }}>
            ← Back to livin.in
          </a>
        </div>
      </div>
    </div>
  )
}
