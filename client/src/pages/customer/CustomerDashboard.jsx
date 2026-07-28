import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { bookingService, eventService } from '../../services'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { FaCalendarAlt, FaMusic, FaStar, FaArrowRight, FaMapMarkerAlt, FaInstagram, FaTiktok } from 'react-icons/fa'

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [events,   setEvents]   = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([bookingService.getMy(), eventService.getMy()])
      .then(([bRes, eRes]) => {
        setBookings(bRes.data.data.slice(0, 5))
        setEvents(eRes.data.data.slice(0, 5))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Total Booking',    value: bookings.length, icon: <FaCalendarAlt className="text-primary-400" /> },
    { label: 'Booking Aktif',    value: bookings.filter(b => b.status_booking === 'confirmed').length, icon: <FaMusic className="text-green-400" /> },
    { label: 'Request Event',    value: events.length,   icon: <FaStar className="text-yellow-400" /> },
  ]

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Selamat datang, {user?.nama}! 👋</h1>
          <p className="text-gray-400 mt-1">Berikut ringkasan aktivitas kamu di Soundville.</p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-dark-700 rounded-xl flex items-center justify-center text-xl">
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-gray-400 text-sm">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Recent Bookings */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Booking Terbaru</h2>
                <Link to="/bookings" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
                  Lihat semua <FaArrowRight className="text-xs" />
                </Link>
              </div>
              {bookings.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-gray-400 text-sm mb-3">Belum ada booking</p>
                  <Link to="/studios" className="btn-primary text-sm">Booking Studio</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map(b => (
                    <div key={b.id_booking} className="card py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white text-sm">{b.nama_studio}</p>
                        <p className="text-gray-500 text-xs">{b.tanggal?.split('T')[0]} · {b.jam_mulai?.substring(0,5)}-{b.jam_selesai?.substring(0,5)}</p>
                      </div>
                      <StatusBadge status={b.status_booking} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="font-semibold text-white mb-4">Aksi Cepat</h2>
              <div className="space-y-3">
                {[
                  { to: '/studios',       label: 'Booking Studio',        icon: <FaCalendarAlt />, color: 'text-primary-400' },
                  { to: '/event-request', label: 'Request Event',          icon: <FaStar />,        color: 'text-yellow-400' },
                  { to: '/bookings',      label: 'Riwayat Booking',        icon: <FaMusic />,       color: 'text-green-400'  },
                  { to: '/events',        label: 'Status Event Request',   icon: <FaStar />,        color: 'text-purple-400' },
                ].map(a => (
                  <Link key={a.to} to={a.to}
                    className="card flex items-center justify-between py-3 hover:border-primary-400/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg ${a.color}`}>{a.icon}</span>
                      <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{a.label}</span>
                    </div>
                    <FaArrowRight className="text-gray-600 group-hover:text-primary-400 transition-colors text-xs" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-16 pt-8 border-t border-dark-700">
          <h2 className="text-2xl font-bold text-white mb-8">Hubungi Kami</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Address */}
            <div className="card p-6">
              <div className="flex items-start gap-3 mb-4">
                <FaMapMarkerAlt className="text-primary-400 text-xl mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white mb-1">Alamat</p>
                  <p className="text-gray-400 text-sm leading-relaxed">Jl. Bougenvile No.21A, Jatimulyo, Kec. Lowokwaru, Kota Malang, Jawa Timur 65141</p>
                </div>
              </div>
              <a href="https://www.google.com/maps/place/SoundVille+Studio/@-7.9553895,112.6242538,17z" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 text-sm mt-3 inline-flex items-center gap-1">
                Buka di Maps <FaArrowRight className="text-xs" />
              </a>
            </div>

            {/* Phone */}
            <div className="card p-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-400 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.75-.25 1.02l-2.2 2.2z"/>
                </svg>
                <div>
                  <p className="font-semibold text-white mb-1">Telepon</p>
                  <a href="tel:+62851658308971" className="text-gray-400 hover:text-primary-300 text-sm">0851-6583-0897</a>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="card p-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-400 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
                <div>
                  <p className="font-semibold text-white mb-1">Jam Operasional</p>
                  <p className="text-gray-400 text-sm">Buka – Tutup pukul 23:00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Ikuti Kami di Sosial Media</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/soundvillemusic/"
                target="_blank"
                rel="noopener noreferrer"
                className="card group hover:scale-105 cursor-pointer p-4 transition-all flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white group-hover:shadow-lg group-hover:shadow-pink-500/50 transition-all flex-shrink-0">
                  <FaInstagram className="text-2xl" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Instagram</h4>
                  <p className="text-gray-400 text-sm">@soundvillemusic</p>
                </div>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@soundville.studio4"
                target="_blank"
                rel="noopener noreferrer"
                className="card group hover:scale-105 cursor-pointer p-4 transition-all flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-black to-gray-800 flex items-center justify-center text-white group-hover:shadow-lg group-hover:shadow-white/50 transition-all flex-shrink-0">
                  <FaTiktok className="text-2xl" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">TikTok</h4>
                  <p className="text-gray-400 text-sm">@soundville.studio4</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
