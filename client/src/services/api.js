import axios from 'axios' // HTTP client library

// Buat axios instance dengan base URL dan timeout
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // Membaca URL backend dari env saat prod
  timeout: 15000, // Request timeout 15 detik
})

// Request interceptor — otomatis tambahkan JWT token ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') // Ambil token dari localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}` // Tambahkan token ke Authorization header
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle error responses (terutama 401/token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || ''
    
    // Handle 401 Unauthorized - token tidak valid atau sudah expired
    if (status === 401) {
      localStorage.removeItem('token') // Hapus token
      localStorage.removeItem('user') // Hapus user data
      delete api.defaults.headers.common['Authorization'] // Hapus auth header
      window.location.href = '/login' // Redirect ke login page
    }
    
    // 403 dan error lainnya biarkan component handle dengan proper error details
    return Promise.reject(error)
  }
)

export default api // Export axios instance untuk digunakan di services
