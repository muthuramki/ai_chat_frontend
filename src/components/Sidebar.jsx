import { useState, useEffect, useRef } from 'react'

const styles = {
  sidebar: {
    width: 280,
    minWidth: 280,
    background: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    padding: '32px 20px',
    gap: '40px',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 12px',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    background: 'linear-gradient(45deg, var(--accent) 0%, var(--accent-pink) 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    boxShadow: '0 0 15px rgba(124, 77, 255, 0.4)',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  navGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  navItem: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '16px',
    background: active ? 'rgba(124, 77, 255, 0.15)' : 'transparent',
    color: active ? '#fff' : 'var(--text2)',
    fontSize: '14px',
    fontWeight: active ? '600' : '400',
    cursor: 'pointer',
    transition: 'all 0.3s',
  }),
  navIcon: (active) => ({
    fontSize: '18px',
    color: active ? 'var(--accent)' : 'var(--text3)',
  }),
  bottomSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '0 12px',
  },
  bottomItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: 'var(--text2)',
    fontSize: '14px',
    cursor: 'pointer',
  },
  profile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '20px',
    border: '1px solid var(--glass-border)',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #00e5ff 0%, #7c4dff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  profileName: { fontSize: '13px', fontWeight: '600', color: '#fff' },
  profileEmail: { fontSize: '11px', color: 'var(--text3)' },
  
  // CUSTOM DROPDOWN
  dropdown: {
    position: 'relative',
    marginBottom: '20px',
    padding: '0 12px',
  },
  dropdownTrigger: {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--glass-border)',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: '16px',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: '12px',
    right: '12px',
    marginTop: '8px',
    background: '#1a1a2e',
    border: '1px solid var(--glass-border)',
    borderRadius: '16px',
    overflow: 'hidden',
    zIndex: 100,
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
  },
  dropdownOption: {
    padding: '12px 16px',
    fontSize: '13px',
    color: 'var(--text2)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }
}

const NAV_ITEMS = [
  { id: 'chat', label: 'Chats', icon: '💬' },
  { id: 'query', label: 'Console', icon: '⌨' },
  { id: 'schema', label: 'Structure', icon: '◈' },
]

export default function Sidebar({ active, onNav, activeConnId, onConnChange, connections, schema }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const tables = schema?.tables || []



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const activeConn = connections.find(c => String(c.id) === String(activeConnId))

  const user = JSON.parse(localStorage.getItem('user') || '{"username": "Admin", "role": "admin"}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoRow}>
        <div style={styles.logoIcon}>∞</div>
        <div style={styles.logoText}>Learn With AI</div>
      </div>

      <div style={styles.navGroup}>
        {/* CUSTOM DROPDOWN REPLACING NATIVE SELECT */}
        <div style={styles.dropdown} ref={dropdownRef}>
          <div 
            style={styles.dropdownTrigger} 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span style={{ color: activeConn ? '#fff' : 'var(--text3)' }}>
              {activeConn ? activeConn.name : 'Active Environment'}
            </span>
            <span style={{ fontSize: '10px', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>▼</span>
          </div>

          {isDropdownOpen && (
            <div style={styles.dropdownMenu}>
              {connections.length === 0 && (
                <div style={{ ...styles.dropdownOption, color: 'var(--text3)', fontStyle: 'italic' }}>No environments found</div>
              )}
              {connections.map(c => (
                <div 
                  key={c.id} 
                  style={{ 
                    ...styles.dropdownOption, 
                    background: String(c.id) === String(activeConnId) ? 'rgba(124, 77, 255, 0.2)' : 'transparent',
                    color: String(c.id) === String(activeConnId) ? '#fff' : 'var(--text2)',
                  }}
                  onClick={() => {
                    onConnChange(c.id)
                    setIsDropdownOpen(false)
                  }}
                  onMouseEnter={e => {
                    if (String(c.id) !== String(activeConnId)) e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                  }}
                  onMouseLeave={e => {
                    if (String(c.id) !== String(activeConnId)) e.target.style.background = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{c.name}</span>
                    <span style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase' }}>{c.role}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        {NAV_ITEMS.map(n => (
          <div key={n.id} style={styles.navItem(active === n.id)} onClick={() => onNav(n.id)}>
            <span style={styles.navIcon(active === n.id)}>{n.icon}</span>
            {n.label}
          </div>
        ))}
      </div>

      <div style={styles.bottomSection}>
        <div style={styles.bottomItem} onClick={() => onNav('connections')}>
          <span style={{ fontSize: '18px' }}>⚙</span>
          Settings
        </div>
        <div style={styles.bottomItem} onClick={handleLogout}>
          <span style={{ fontSize: '18px' }}>↪</span>
          Log Out
        </div>
        
        <div style={styles.profile}>
          <div style={styles.avatar}>{user.username?.[0]?.toUpperCase() || 'A'}</div>
          <div style={styles.profileInfo}>
            <div style={styles.profileName}>{user.username}</div>
            <div style={styles.profileEmail}>
               {user.role?.toUpperCase()} MODE
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
