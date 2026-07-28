/**
 * Image path utility for consistent image URLs across the app
 * Handles both local development (localhost:5000) and production
 */

const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000'

/**
 * Get full image URL
 * @param {string} filePath - Relative file path from uploads (e.g., "studios/studio-123.jpg")
 * @returns {string} Full URL
 */
export const getImageUrl = (filePath) => {
  if (!filePath) return '/logo.png' // Fallback to logo
  if (filePath.startsWith('http')) return filePath // Already absolute URL
  // Add uploads/ prefix if not already present
  const fullPath = filePath.startsWith('uploads/') ? filePath : `uploads/${filePath}`
  return `${API_BASE}/${fullPath}`
}

/**
 * Alternative: Use relative path if images are served from same domain
 * This is more reliable for production
 */
export const getImagePath = (filePath) => {
  if (!filePath) return '/logo.png'
  if (filePath.startsWith('/')) return filePath
  return `/${filePath}`
}

export default getImageUrl
