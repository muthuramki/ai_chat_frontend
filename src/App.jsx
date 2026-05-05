import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ChatPage from './pages/ChatPage'
import QueryPage from './pages/QueryPage'
import SchemaPage from './pages/SchemaPage'
import ConnectionsPage from './pages/ConnectionsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { useSchema } from './hooks/useSchema'
import { fetchConnections } from './services/api'
import './assets/global.css'

function MainLayout() {
  const [page, setPage] = useState('chat')
  const [activeConnId, setActiveConnId] = useState(localStorage.getItem('activeConnectionId') || '')
  const [connections, setConnections] = useState([])
  const { schema, loading, error } = useSchema(activeConnId)

  useEffect(() => {
    refreshConnections()
  }, [])

  const refreshConnections = async () => {
    try {
      const data = await fetchConnections()
      setConnections(data)
      if (data.length > 0 && !localStorage.getItem('activeConnectionId')) {
        handleConnChange(data[0].id)
      }
    } catch (e) {
      console.error('Failed to load connections', e)
    }
  }

  const handleConnChange = (id) => {
    localStorage.setItem('activeConnectionId', id)
    setActiveConnId(id)
  }

  const renderPage = () => {
    switch (page) {
      case 'chat':   return <ChatPage activeConnId={activeConnId} />
      case 'query':  return <QueryPage activeConnId={activeConnId} />
      case 'schema': return <SchemaPage schema={schema} loading={loading} error={error} activeConnId={activeConnId} />
      case 'connections': return <ConnectionsPage onSelect={handleConnChange} connections={connections} onRefresh={refreshConnections} />
      default:       return <ChatPage activeConnId={activeConnId} />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        active={page}
        onNav={setPage}
        schema={schema}
        schemaLoading={loading}
        schemaError={error}
        activeConnId={activeConnId}
        onConnChange={handleConnChange}
        connections={connections}
      />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'transparent', padding: '20px', minHeight: 0 }}>
        <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.02)', borderRadius: '32px', border: '1px solid var(--glass-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
