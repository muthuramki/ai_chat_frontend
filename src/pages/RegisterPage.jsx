import React, { useState } from 'react'
import { register } from '../services/api'
import { useNavigate, Link } from 'react-router-dom'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register(username, password)
      alert('Registration successful! Please login.')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.root}>
      <div style={s.card}>
        <div style={{ fontSize: '32px', fontWeight: '800', textAlign: 'center', marginBottom: '8px' }}>Join Us</div>
        <div style={{ textAlign: 'center', color: 'var(--text3)', marginBottom: '32px' }}>Create your admin account</div>
        
        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={s.inputGroup}>
            <label style={s.label}>USERNAME</label>
            <input 
              style={s.input} 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="Pick a username"
              required 
            />
          </div>
          <div style={s.inputGroup}>
            <label style={s.label}>PASSWORD</label>
            <input 
              style={s.input} 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Secure password"
              required 
            />
          </div>
          <button style={s.btn} disabled={loading}>{loading ? 'CREATING...' : 'CREATE ACCOUNT'}</button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text2)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: '700' }}>Login here</Link>
        </div>
      </div>
    </div>
  )
}

const s = {
  root: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-gradient)' },
  card: { background: 'var(--bg2)', padding: '48px', borderRadius: '32px', border: '1px solid var(--glass-border)', width: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '11px', fontWeight: '800', color: 'var(--text3)' },
  input: { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '14px', color: '#fff' },
  btn: { background: 'var(--accent)', color: '#fff', padding: '16px', borderRadius: '16px', fontWeight: '800', marginTop: '10px' },
  error: { background: 'rgba(255,64,129,0.1)', color: 'var(--accent-pink)', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', textAlign: 'center' }
}
