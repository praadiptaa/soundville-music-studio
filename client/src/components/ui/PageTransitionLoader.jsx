import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Component Indikator Memuat (Page & Route Transition Loader)
 * Menampilkan bar progres emas berkilau di bagian paling atas layar setiap kali pengguna berpindah halaman/fitur.
 */
export default function PageTransitionLoader() {
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // 1. Scroll ke paling atas saat pindah halaman
    window.scrollTo({ top: 0, behavior: 'instant' })

    // 2. Jalankan animasi top progress bar
    setLoading(true)
    setProgress(30)

    const timer1 = setTimeout(() => setProgress(75), 100)
    const timer2 = setTimeout(() => setProgress(100), 250)
    const timer3 = setTimeout(() => {
      setLoading(false)
      setProgress(0)
    }, 400)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [location.pathname, location.search])

  if (!loading && progress === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      {/* Top glowing progress bar */}
      <div
        className="h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.8)] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
