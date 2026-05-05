import { useState } from 'react'
import { runRawQuery } from '../services/api'
import DataTable from '../components/DataTable'

const s = {
  root: { display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '40px' },
  header: { marginBottom: '32px' },
  title: { fontSize: '32px', fontWeight: '800', color: '#fff', letterSpacing: '-1px' },
  sub: { fontSize: '15px', color: 'var(--text2)', marginTop: 8 },
  
  editorCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--glass-border)',
    borderRadius: '24px',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  editorHeader: {
    padding: '16px 24px',
    borderBottom: '1px solid var(--glass-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  runBtn: {
    background: 'var(--accent)',
    color: '#fff',
    padding: '8px 24px',
    borderRadius: '50px',
    fontSize: '13px',
    fontWeight: '700',
    boxShadow: '0 4px 15px rgba(124, 77, 255, 0.3)',
  },
  textarea: {
    width: '100%',
    minHeight: '200px',
    background: 'transparent',
    border: 'none',
    color: 'var(--accent-cyan)',
    fontFamily: 'var(--font-mono)',
    fontSize: '15px',
    padding: '24px',
    outline: 'none',
    resize: 'vertical',
  },
  resultCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--glass-border)',
    borderRadius: '24px',
    padding: '24px',
    overflow: 'auto',
  }
}

export default function QueryPage() {
  const [sql, setSql] = useState('SELECT * FROM patients LIMIT 10')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await runRawQuery(sql)
      setResult(data)
    } catch (e) {
      let msg = e.message
      if (e.response?.status === 403) {
        msg = "⚠️ Access Denied: Raw SQL modifications are blocked for Read-Only users. Please switch to an 'Admin' profile."
      } else if (e.response?.data?.detail) {
        msg = e.response.data.detail
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.root}>
      <header style={s.header}>
        <div style={s.title}>SQL Console</div>
        <div style={s.sub}>Execute direct queries on the connected environment.</div>
      </header>

      <div style={s.editorCard}>
        <div style={s.editorHeader}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase' }}>SQL Editor</span>
          <button style={s.runBtn} onClick={run} disabled={loading}>
            {loading ? 'RUNNING...' : 'EXECUTE'}
          </button>
        </div>
        <textarea style={s.textarea} value={sql} onChange={e => setSql(e.target.value)} spellCheck={false} />
      </div>

      {error && <div style={{ color: 'var(--accent-pink)', marginBottom: '20px' }}>{error}</div>}
      
      {result && (
        <div style={s.resultCard}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '16px' }}>Results</div>
          <DataTable rows={result.rows} />
        </div>
      )}
    </div>
  )
}
