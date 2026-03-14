'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-browser'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Check if already logged in
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        routeByRole(profile?.role || session.user.user_metadata?.role || 'user')
      }
    }
    checkSession()
  }, [])

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

      // Get role and redirect
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      routeByRole(profile?.role || data.user.user_metadata?.role || 'user')
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
      <div style={{ width: '100%', maxWidth: '420px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontFamily: "'Libre Caslon Display', Georgia, serif",
            fontSize: '40px', color: '#1a1a1a', marginBottom: '8px',
          }}>LIVIN</div>
          <p style={{ fontSize: '16px', fontWeight: 300, color: '#999' }}>Sign in to your dashboard</p>
        </div>

        <div style={{
          background: '#fff', borderRadius: '18px',
          border: '1px solid #EEEAE4', padding: '36px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
        }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#999', marginBottom: '8px' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@livin.in" required
                style={{ width: '100%', padding: '14px 18px', background: '#F9F7F3', border: '1px solid #EEEAE4', borderRadius: '12px', fontSize: '15px', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#E85D2A'}
                onBlur={e => e.target.style.borderColor = '#EEEAE4'}
              />
            </div>
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#999', marginBottom: '8px' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" required
                style={{ width: '100%', padding: '14px 18px', background: '#F9F7F3', border: '1px solid #EEEAE4', borderRadius: '12px', fontSize: '15px', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#E85D2A'}
                onBlur={e => e.target.style.borderColor = '#EEEAE4'}
              />
            </div>
            {error && (
              <div style={{ padding: '12px 16px', background: '#FFF5ED', border: '1px solid #FDDCBB', borderRadius: '12px', fontSize: '13px', color: '#93400D', marginBottom: '18px' }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '16px',
                background: loading ? '#ddd' : 'linear-gradient(135deg, #FF8C3C, #E85D2A)',
                color: '#fff', border: 'none', borderRadius: '100px',
                fontSize: '16px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(232,93,42,0.25)',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <a href="/" style={{ fontSize: '13px', color: '#999', textDecoration: 'none' }}>← Back to livin.in</a>
        </div>
      </div>
    </div>
  )
}
