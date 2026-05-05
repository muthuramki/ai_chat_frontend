const styles = {
  wrap: {
    overflowX: 'auto',
    borderRadius: 'var(--r)',
    border: '1px solid var(--border)',
    marginTop: 12,
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
  },
  th: {
    background: 'var(--surface)',
    padding: '9px 14px',
    textAlign: 'left',
    color: 'var(--accent)',
    fontWeight: 500,
    fontSize: 11,
    whiteSpace: 'nowrap',
    borderBottom: '1px solid var(--border)',
    letterSpacing: '0.04em',
  },
  td: {
    padding: '8px 14px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text)',
    whiteSpace: 'nowrap',
    maxWidth: 240,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  trEven: { background: 'rgba(255,255,255,0.015)' },
  null: { color: 'var(--text3)', fontStyle: 'italic' },
  rowCount: {
    fontSize: 11,
    color: 'var(--text3)',
    marginTop: 8,
    textAlign: 'right',
    fontFamily: 'var(--font-mono)',
  },
  emptyRow: {
    padding: '20px 14px',
    textAlign: 'center',
    color: 'var(--text3)',
    fontSize: 12,
    fontStyle: 'italic',
  }
}

export default function DataTable({ rows, columns }) {
  // columns: backend-இருந்து வந்த header list
  // rows: actual data
  const hasRows = rows && rows.length > 0
  const cols = hasRows ? Object.keys(rows[0]) : (columns || [])

  // cols இல்லன்னா nothing to show
  if (!cols.length) return null

  return (
    <>
      <div style={styles.wrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {cols.map(c => <th key={c} style={styles.th}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {hasRows ? (
              rows.map((row, i) => (
                <tr key={i} style={i % 2 === 0 ? {} : styles.trEven}>
                  {cols.map(c => (
                    <td key={c} style={styles.td} title={String(row[c] ?? '')}>
                      {row[c] === null
                        ? <span style={styles.null}>null</span>
                        : String(row[c])}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              // Empty state - headers காட்டி "no data" row
              <tr>
                <td colSpan={cols.length} style={styles.emptyRow}>
                  — No records found —
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={styles.rowCount}>
        {hasRows ? `${rows.length} row${rows.length !== 1 ? 's' : ''}` : '0 rows'}
      </div>
    </>
  )
}