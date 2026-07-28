import { createContext, useContext, useState, useEffect } from 'react' // React hooks dan Context API
import api from '../services/api' // API client untuk HTTP requests

/**
 * Context object untuk Authentication.
 * @type {React.Context<Object|null>}
 */
const AuthContext = createContext(null) // Create Auth context untuk state sharing

/**
 * AuthProvider component - Menyediakan authentication state dan actions ke seluruh aplikasi
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components yang dibungkus
 * @returns {React.ReactElement} AuthContext Provider element
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null) // Current logged-in user
  const [loading, setLoading] = useState(true) // Loading state saat check token

  // Initialize auth state dari localStorage saat component mount
  useEffect(() => {
    const token = localStorage.getItem('token') // Get JWT token dari localStorage
    const saved = localStorage.getItem('user') // Get saved user data dari localStorage
    if (token && saved) {
      setUser(JSON.parse(saved)) // Set user state jika token ada
      api.defaults.headers.common['Authorization'] = `Bearer ${token}` // Set Authorization header untuk API calls
    }
    setLoading(false) // Selesai loading
  }, [])

  /**
   * Fungsi untuk menyimpan token dan user ke localStorage setelah login berhasil
   * @param {Object} userData - Data user ter-sanitize
   * @param {string} token - JWT token
   */
  const login = (userData, token) => {
    localStorage.setItem('token', token) // Simpan JWT token
    localStorage.setItem('user', JSON.stringify(userData)) // Simpan user data
    api.defaults.headers.common['Authorization'] = `Bearer ${token}` // Set auth header untuk API calls
    setUser(userData) // Update user state
  }

  /**
   * Fungsi untuk menghapus semua auth data dan log out user
   */
  const logout = () => {
    localStorage.removeItem('token') // Hapus token dari localStorage
    localStorage.removeItem('user') // Hapus user data dari localStorage
    delete api.defaults.headers.common['Authorization'] // Remove auth header
    setUser(null) // Reset user state
  }

  // Provide auth context ke child components
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Custom hook untuk mengakses Authentication context (user, loading, login, logout)
 * @returns {Object} Auth context value
 */
export const useAuth = () => useContext(AuthContext)
