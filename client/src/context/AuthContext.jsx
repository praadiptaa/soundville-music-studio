import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { authService } from '../services'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const saved = localStorage.getItem('user')

    if (token) {
      if (saved) {
        setUser(JSON.parse(saved))
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // Synchronize latest user profile & role directly from backend database
      authService.getMe()
        .then(res => {
          if (res.data?.success && res.data?.data) {
            const latestUser = res.data.data
            setUser(latestUser)
            localStorage.setItem('user', JSON.stringify(latestUser))
          }
        })
        .catch(() => {
          // If token expired or invalid, clear auth state
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          delete api.defaults.headers.common['Authorization']
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
