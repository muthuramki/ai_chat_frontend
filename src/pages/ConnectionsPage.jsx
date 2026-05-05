import { useState, useEffect } from 'react'
import { testConnection, saveConnection, deleteConnection } from '../services/api'

export default function ConnectionsPage({ onSelect, connections, onRefresh }) {
  const [form, setForm] = useState({ name: '', host: '', port: 3306, username: '', password: '', database_name: '', role: 'read_only' })
  const [status, setStatus] = useState({ type: '', msg: '' })
  const [testing, setTesting] = useState(false)
  const activeConnId = localStorage.getItem('activeConnectionId')

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await saveConnection(form)
      onRefresh()
      setForm({ name: '', host: '', port: 3306, username: '', password: '', database_name: '', role: 'read_only' })
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', height: '100%', overflowY: 'auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#fff' }}>Environment Settings</h1>
        <p style={{ color: 'var(--text2)', marginTop: '8px' }}>Manage and switch between your data environments.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--accent-cyan)' }}>Active Profiles</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {connections.map(c => (
              <div 
                key={c.id} 
                onClick={() => onSelect(c.id)}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '24px', 
                  border: String(activeConnId) === String(c.id) ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                  cursor: 'pointer', transition: '0.3s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '18px', color: '#fff' }}>{c.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '4px' }}>{c.host} • {c.database_name} • <span style={{ color: 'var(--accent-cyan)', fontWeight: '700', fontSize: '11px' }}>{c.role.toUpperCase()}</span></div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete this profile?')) deleteConnection(c.id).then(onRefresh); }}
                  style={{ background: 'rgba(255, 64, 129, 0.1)', color: 'var(--accent-pink)', padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}
                >
                  REMOVE
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '32px', borderRadius: '32px', border: '1px solid var(--glass-border)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>Add New Connection</h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text3)' }}>NAME</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Production DB" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
               <input value={form.host} onChange={e => setForm({...form, host: e.target.value})} placeholder="Host" required />
               <input value={form.port} onChange={e => setForm({...form, port: e.target.value})} placeholder="Port" type="number" required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text3)' }}>ACCESS ROLE</label>
              <select 
                value={form.role} 
                onChange={e => setForm({...form, role: e.target.value})}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid var(--glass-border)', 
                  padding: '12px', borderRadius: '16px', fontSize: '14px', cursor: 'pointer' 
                }}
              >
                <option value="read_only" style={{ background: '#1a1a2e' }}>Read-Only (Secure)</option>
                <option value="admin" style={{ background: '#1a1a2e' }}>Administrator (Full Access)</option>
              </select>
            </div>
            <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="Username" required />
            <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Password" type="password" required />
            <input value={form.database_name} onChange={e => setForm({...form, database_name: e.target.value})} placeholder="Database Name" required />
            
            <button 
              type="submit" 
              style={{ 
                background: 'var(--accent)', padding: '14px', borderRadius: '50px', 
                color: '#fff', fontWeight: '800', fontSize: '14px', marginTop: '12px',
                boxShadow: '0 8px 32px rgba(124, 77, 255, 0.3)'
              }}
            >
              SAVE CONNECTION
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
