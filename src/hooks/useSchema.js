import { useState, useEffect } from 'react'
import { fetchSchema } from '../services/api'

export function useSchema(connId) {
  const [schema, setSchema] = useState({ tables: [], schema: {} })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!connId) {
      setSchema({ tables: [], schema: {} })
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    
    fetchSchema(connId)
      .then(setSchema)
      .catch(e => setError(e?.response?.data?.detail || e.message))
      .finally(() => setLoading(false))
  }, [connId])

  return { schema, loading, error }
}
