/**
 * Image path utility for consistent image URLs across the app
 * Handles local development, production, absolute URLs, and Base64 Data URLs
 */

const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000'

/**
 * Get full image URL
 * @param {string} filePath - Relative file path, absolute URL, or Base64 Data URL
 * @returns {string} Full URL
 */
export const getImageUrl = (filePath) => {
  if (!filePath) return '/logo.png' // Fallback ke logo
  // Jika sudah URL absolut (http/https) atau Data URL Base64, return langsung
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
    return filePath
  }
  // Tambahkan prefix uploads/ jika belum ada
  const fullPath = filePath.startsWith('uploads/') ? filePath : `uploads/${filePath}`
  return `${API_BASE}/${fullPath}`
}

/**
 * Alternative: Use relative path if images are served from same domain
 */
export const getImagePath = (filePath) => {
  if (!filePath) return '/logo.png'
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
    return filePath
  }
  if (filePath.startsWith('/')) return filePath
  return `/${filePath}`
}

export default getImageUrl
