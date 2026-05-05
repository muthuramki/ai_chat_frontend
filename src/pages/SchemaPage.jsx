const s = {
  root: { display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '40px' },
  header: { marginBottom: '32px' },
  title: { fontSize: '32px', fontWeight: '800', color: '#fff', letterSpacing: '-1px' },
  sub: { fontSize: '15px', color: 'var(--text2)', marginTop: 8 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', overflowY: 'auto', paddingBottom: '40px' },
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--glass-border)',
    borderRadius: '24px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' },
  icon: { color: 'var(--accent-cyan)' },
  colList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  colItem: { fontSize: '13px', color: 'var(--text2)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '8px' },
  dot: { width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)' },
}

export default function SchemaPage({ schema, loading, error }) {
  if (loading) return <div style={s.root}><div style={{ color: 'var(--accent)' }}>Fetching catalog...</div></div>
  
  return (
    <div style={s.root}>
      <header style={s.header}>
        <div style={s.title}>Schema Structure</div>
        <div style={s.sub}>Visual map of all data objects in the current database.</div>
      </header>
      
      <div style={s.grid}>
        {schema.tables?.map(t => (
          <div key={t} style={s.card}>
            <div style={s.cardTitle}>
              <span style={s.icon}>◈</span>
              {t}
            </div>
            <div style={s.colList}>
              {(schema.schema[t] || []).map(col => (
                <div key={col} style={s.colItem}>
                  <div style={s.dot} />
                  {col}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
