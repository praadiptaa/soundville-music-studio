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

/**
 * Safely open image (HTTP URL or Base64 Data URL) in a new tab
 * Prevents 414 Request-URI Too Large error on web servers when clicking Base64 data URIs
 */
export const openImageInNewTab = (src) => {
  if (!src) return
  if (src.startsWith('data:')) {
    const newWindow = window.open('')
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Bukti Transfer - Soundville Music Studio</title>
            <style>
              body { margin: 0; background: #0f172a; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; }
              img { max-width: 95vw; max-height: 95vh; object-fit: contain; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
            </style>
          </head>
          <body>
            <img src="${src}" alt="Bukti Transfer" />
          </body>
        </html>
      `)
      newWindow.document.close()
    }
  } else {
    window.open(src, '_blank', 'noopener,noreferrer')
  }
}

export default getImageUrl
