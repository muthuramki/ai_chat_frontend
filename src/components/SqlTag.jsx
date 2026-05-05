import { useState } from 'react'

export default function SqlTag({ sql }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r)',
      padding: '10px 14px',
      marginTop: 10,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
    }}>
      <span style={{ color: 'var(--text3)', fontSize: 10, fontFamily: 'var(--font-mono)', marginTop: 2, flexShrink: 0 }}>SQL</span>
      <code style={{
        flex: 1,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--accent)',
        wordBreak: 'break-all',
        lineHeight: 1.7,
      }}>{sql}</code>
      <button onClick={copy} style={{
        background: 'transparent',
        border: '1px solid var(--border2)',
        borderRadius: 6,
        padding: '3px 8px',
        fontSize: 10,
        color: copied ? 'var(--accent)' : 'var(--text3)',
        cursor: 'pointer',
        flexShrink: 0,
        fontFamily: 'var(--font-mono)',
        transition: 'color 0.2s',
      }}>
        {copied ? 'copied' : 'copy'}
      </button>
    </div>
  )
}
