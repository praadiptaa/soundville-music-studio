import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  FaTachometerAlt, FaBuilding, FaCalendarCheck,
  FaMoneyBillWave, FaStar, FaUsers, FaChartBar, FaSignOutAlt, FaTools, FaClock
} from 'react-icons/fa'

const baseNavItems = [
  { to: '/admin',                  icon: <FaTachometerAlt />, label: 'Dashboard',       end: true },
  { to: '/admin/studios',          icon: <FaBuilding />,      label: 'Studio' },
  { to: '/admin/event-packages',   icon: <FaStar />,          label: 'Paket Event' },
  { to: '/admin/event-equipment',  icon: <FaTools />,         label: 'Alat Event' },
  { to: '/admin/bookings',         icon: <FaCalendarCheck />, label: 'Booking' },
  { to: '/admin/payments',         icon: <FaMoneyBillWave />, label: 'Pembayaran' },
  { to: '/admin/events',           icon: <FaStar />,          label: 'Event Request' },
  { to: '/admin/shifts',           icon: <FaClock />,          label: 'Shift Operator' },
  { to: '/admin/users',            icon: <FaUsers />,         label: 'Pengguna' },
  { to: '/admin/reports',          icon: <FaChartBar />,      label: 'Laporan', adminOnly: true },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Filter menu berdasarkan role (Sembunyikan laporan jika role operator)
  const navItems = baseNavItems.filter(item => {
    if (item.adminOnly && user?.role !== 'admin') return false
    return true
  })

  return (
    <aside className="w-64 min-h-screen bg-dark-800 border-r border-dark-700 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Soundville" className="h-10 object-contain" />
          <div>
            <p className="text-xs text-primary-400 font-semibold uppercase tracking-wider">
              {user?.role === 'operator' ? 'Operator Panel' : 'Admin Panel'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-400/20 text-primary-300 border border-primary-400/30'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-dark-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary-400 rounded-full flex items-center justify-center text-xs font-bold text-dark-900">
            {user?.nama?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.nama}</p>
            <p className="text-xs text-gray-500 capitalize truncate">{user?.role || 'staff'} • {user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-accent-500 hover:bg-accent-500/10 rounded-lg transition-colors"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </aside>
  )
}
