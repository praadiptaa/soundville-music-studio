import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { reportService } from '../../services'
import { FaCalendarCheck, FaMoneyBillWave, FaUsers, FaStar, FaClock, FaCheckCircle, FaSearch } from 'react-icons/fa'

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)

const MENU_ITEMS = [
  { label: 'Dashboard', path: '/admin', icon: '📊' },
  { label: 'Manage Studios', path: '/admin/studios', icon: '🏢' },
  { label: 'Manage Bookings', path: '/admin/bookings', icon: '📅' },
  { label: 'Manage Payments', path: '/admin/payments', icon: '💳' },
  { label: 'Manage Events', path: '/admin/events', icon: '⭐' },
  { label: 'Manage Users', path: '/admin/users', icon: '👥' },
  { label: 'Reports', path: '/admin/reports', icon: '📈' },
]

// Command Palette untuk quick access
function CommandPalette({ isOpen, onClose }) {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = MENU_ITEMS.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (path) => {
    navigate(path)
    onClose()
    setSearch('')
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        !isOpen && onClose?.()
      }
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 p-4" onClick={onClose}>
      <div className="bg-dark-800 rounded-xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="relative p-4 border-b border-dark-700">
          <FaSearch className="absolute left-6 top-4 text-gray-500" />
          <input
            type="text"
            placeholder="Cari fitur admin..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2 pl-9 text-white placeholder-gray-500 focus:outline-none focus:border-primary-400"
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Tidak ada hasil.</div>
          ) : (
            filtered.map(item => (
              <button
                key={item.path}
                onClick={() => handleSelect(item.path)}
                className="w-full text-left px-4 py-3 hover:bg-dark-700 transition-colors flex items-center gap-3"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-white">{item.label}</span>
              </button>
            ))
          )}
        </div>
        <div className="border-t border-dark-700 p-3 text-xs text-gray-500 text-center">
          Tekan ESC untuk menutup
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ icon, label, value, color = 'text-primary-300', bg = 'bg-primary-400/10', onClick }) => (
  <button
    onClick={onClick}
    className="card flex items-center gap-4 hover:border-primary-400/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-primary-400/20"
  >
    <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center text-xl ${color}`}>{icon}</div>
    <div className="text-left">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  </button>
)

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    reportService.getDashboard()
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (loading) return <AdminLayout title="Dashboard"><LoadingSpinner text="Memuat statistik..." /></AdminLayout>

  const ov = stats?.overview || {}

  return (
    <AdminLayout title="Dashboard">
      {/* Search Bar */}
      <button
        onClick={() => setSearchOpen(true)}
        className="mb-6 w-full max-w-md px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-gray-400 text-sm hover:border-primary-400/50 transition-colors flex items-center gap-2"
      >
        <FaSearch className="text-xs" />
        Cari fitur (Ctrl+K)
      </button>

      {/* Command Palette */}
      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Overview Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<FaCalendarCheck />}
          label="Total Booking"
          value={ov.totalBookings || 0}
          onClick={() => navigate('/admin/bookings')}
        />
        <StatCard
          icon={<FaClock />}
          label="Menunggu Konfirmasi"
          value={ov.pendingBookings || 0}
          color="text-yellow-400"
          bg="bg-yellow-500/10"
          onClick={() => navigate('/admin/bookings?filter=pending')}
        />
        <StatCard
          icon={<FaMoneyBillWave />}
          label="Pembayaran Pending"
          value={ov.pendingPayments || 0}
          color="text-orange-400"
          bg="bg-orange-500/10"
          onClick={() => navigate('/admin/payments?filter=pending')}
        />
        <StatCard
          icon={<FaUsers />}
          label="Total Customer"
          value={ov.totalCustomers || 0}
          color="text-blue-400"
          bg="bg-blue-500/10"
          onClick={() => navigate('/admin/users')}
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<FaCheckCircle />}
          label="Booking Confirmed"
          value={ov.confirmedBookings || 0}
          color="text-green-400"
          bg="bg-green-500/10"
          onClick={() => navigate('/admin/bookings?filter=confirmed')}
        />
        <StatCard
          icon={<FaStar />}
          label="Total Event"
          value={ov.totalEvents || 0}
          color="text-purple-400"
          bg="bg-purple-500/10"
          onClick={() => navigate('/admin/events')}
        />
        <StatCard
          icon={<FaStar />}
          label="Event Pending"
          value={ov.pendingEvents || 0}
          color="text-yellow-400"
          bg="bg-yellow-500/10"
          onClick={() => navigate('/admin/events?filter=pending')}
        />
        <button
          onClick={() => navigate('/admin/reports')}
          className="card flex items-center gap-4 hover:border-primary-400/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-primary-400/20"
        >
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-xl text-green-400">
            <FaMoneyBillWave />
          </div>
          <div className="text-left">
            <p className="text-lg font-bold text-green-400">{formatRupiah(ov.totalRevenue)}</p>
            <p className="text-gray-400 text-sm">Total Pendapatan</p>
          </div>
        </button>
      </div>

      {/* Booking per bulan */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Booking Per Bulan</h3>
          {stats?.bookingPerMonth?.length === 0 ? (
            <p className="text-gray-500 text-sm">Belum ada data.</p>
          ) : (
            <div className="space-y-2">
              {stats?.bookingPerMonth?.map(b => (
                <div key={b.bulan} className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-20">{b.bulan}</span>
                  <div className="flex-1 bg-dark-700 rounded-full h-2 overflow-hidden">
                    <div className="h-2 bg-primary-400 rounded-full"
                      style={{ width: `${Math.min((b.total / (Math.max(...(stats.bookingPerMonth.map(x=>x.total)||[1]))) * 100), 100)}%` }} />
                  </div>
                  <span className="text-white text-sm font-medium w-8 text-right">{b.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Studio terpopuler */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Studio Terpopuler</h3>
          {stats?.popularStudios?.length === 0 ? (
            <p className="text-gray-500 text-sm">Belum ada data.</p>
          ) : (
            <div className="space-y-3">
              {stats?.popularStudios?.map((s, i) => (
                <div key={s.nama_studio} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-dark-700 text-gray-400'}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-gray-300 text-sm">{s.nama_studio}</span>
                  <span className="text-primary-300 font-semibold text-sm">{s.total_booking} booking</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
