import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 🔹 Interceptor to add Connection ID and JWT
api.interceptors.request.use((config) => {
  const connId = localStorage.getItem('activeConnectionId')
  const token = localStorage.getItem('token')
  
  if (connId) {
    config.headers['X-Connection-ID'] = connId
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 🔹 Schema
export const fetchSchema = async (id = null) => {
  const headers = id ? { 'X-Connection-ID': id } : {}
  const res = await api.get('/schema', { headers })
  return res.data
}

// 🔹 Manual SQL
export const runRawQuery = async (sql) => {
  const res = await api.post('/query', { sql })
  return res.data
}

// 🔥 AI Function
export const askAI = async (prompt, history = [], confirm = false) => {
  const res = await api.post('/ai', {
    prompt,
    history,
    confirm
  })
  return res.data
}

// 🔹 Connections API
export const testConnection = async (config) => {
  const res = await api.post('/connections/test', config)
  return res.data
}

export const saveConnection = async (config) => {
  const res = await api.post('/connections', config)
  return res.data
}

export const fetchConnections = async () => {
  const res = await api.get('/connections')
  return res.data
}

export const deleteConnection = async (id) => {
  const res = await api.delete(`/connections/${id}`)
  return res.data
}

// 🔐 Auth
export const login = (username, password) => api.post('/auth/login', { username, password })
export const register = (username, password) => api.post('/auth/register', { username, password })

// 🔹 Health
export const checkHealth = async () => {
  const res = await api.get('/health')
  return res.data
}