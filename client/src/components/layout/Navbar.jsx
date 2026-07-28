import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaChevronDown } from 'react-icons/fa'
import { useState } from 'react'

/**
 * Component Navbar Navigasi Utama
 * 
 * @description
 * Header bar navigasi utama yang responsif. Menampilkan link publik untuk guest,
 * menu khusus booking & riwayat untuk customer yang login, link dashboard untuk admin,
 * serta action login/logout.
 * 
 * @component
 * @returns {React.ReactElement} Navbar element
 */
export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [bookingDropdown, setBookingDropdown] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleBookingSelect = (path) => {
    navigate(path)
    setBookingDropdown(false)
  }

  return (
    <nav className="bg-dark-800/80 border-b border-primary-400/20 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Soundville Logo" className="h-12 object-contain animate-float" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {!user && (
              <>
                <a href="/#studio" className="text-gray-300 hover:text-primary-300 transition-colors text-sm font-medium relative group">
                  Studio
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-accent-600 group-hover:w-full transition-all" />
                </a>
                <a href="/#event" className="text-gray-300 hover:text-primary-300 transition-colors text-sm font-medium relative group">
                  Event
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-accent-600 group-hover:w-full transition-all" />
                </a>
                <a href="/#contact" className="text-gray-300 hover:text-primary-300 transition-colors text-sm font-medium relative group">
                  Kontak
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-accent-600 group-hover:w-full transition-all" />
                </a>
              </>
            )}
            
            {user ? (
              <>
                {['admin', 'operator'].includes(user.role) ? (
                  <Link to="/admin" className="text-gray-300 hover:text-primary-300 transition-colors text-sm font-medium relative group">
                    {user.role === 'operator' ? 'Panel Operator' : 'Dashboard Admin'}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-accent-600 group-hover:w-full transition-all" />
                  </Link>
                ) : (
                  <>
                    {/* Booking Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setBookingDropdown(!bookingDropdown)}
                        className="text-gray-300 hover:text-primary-300 transition-colors text-sm font-medium relative group flex items-center gap-1"
                      >
                        Booking
                        <FaChevronDown className={`text-xs transition-transform ${bookingDropdown ? 'rotate-180' : ''}`} />
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-accent-600 group-hover:w-full transition-all" />
                      </button>
                      
                      {bookingDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-dark-800 border border-primary-400/30 rounded-lg shadow-lg overflow-hidden z-50">
                          <button
                            onClick={() => handleBookingSelect('/studios')}
                            className="w-full text-left px-4 py-3 text-gray-300 hover:bg-primary-400/20 hover:text-primary-300 transition-colors text-sm border-b border-dark-700"
                          >
                            📚 Booking Studio
                          </button>
                          <button
                            onClick={() => handleBookingSelect('/event-request')}
                            className="w-full text-left px-4 py-3 text-gray-300 hover:bg-primary-400/20 hover:text-primary-300 transition-colors text-sm"
                          >
                            🎤 Request Event
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <Link to="/dashboard" className="text-gray-300 hover:text-primary-300 transition-colors text-sm font-medium relative group">
                      Dashboard
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-accent-600 group-hover:w-full transition-all" />
                    </Link>
                    <Link to="/bookings" className="text-gray-300 hover:text-primary-300 transition-colors text-sm font-medium relative group">
                      Riwayat
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-accent-600 group-hover:w-full transition-all" />
                    </Link>
                  </>
                )}
                <div className="flex items-center gap-3 ml-2 pl-6 border-l border-primary-400/20">
                  <div className="flex items-center gap-2 bg-primary-400/10 px-3 py-1.5 rounded-lg border border-primary-400/20 hover:border-primary-400/50 transition-all">
                    <FaUser className="text-primary-300 text-xs" />
                    <span className="text-sm text-gray-300">{user.nama}</span>
                  </div>
                  <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-accent-500 transition-colors text-sm hover:scale-105">
                    <FaSignOutAlt />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 pl-6 border-l border-primary-400/20">
                <Link to="/login" className="text-gray-300 hover:text-primary-300 transition-colors text-sm font-medium">Masuk</Link>
                <Link to="/register" className="btn-primary text-sm py-1.5 hover:scale-105">Daftar</Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setOpen(!open)}>
            {open ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden border-t border-dark-700 py-4 space-y-3">
            {!user && (
              <>
                <a href="/#studio" className="block text-gray-300 hover:text-white text-sm" onClick={() => setOpen(false)}>Studio</a>
                <a href="/#event" className="block text-gray-300 hover:text-white text-sm" onClick={() => setOpen(false)}>Event</a>
                <a href="/#contact" className="block text-gray-300 hover:text-white text-sm" onClick={() => setOpen(false)}>Kontak</a>
              </>
            )}
            
            {user ? (
              <>
                {['admin', 'operator'].includes(user.role) ? (
                  <Link to="/admin" className="block text-gray-300 hover:text-white text-sm" onClick={() => setOpen(false)}>
                    {user.role === 'operator' ? 'Panel Operator' : 'Dashboard Admin'}
                  </Link>
                ) : (
                  <>
                    {/* Mobile Booking Menu */}
                    <div className="space-y-2">
                      <button
                        onClick={() => setBookingDropdown(!bookingDropdown)}
                        className="block w-full text-left text-gray-300 hover:text-white text-sm py-1 flex items-center justify-between"
                      >
                        Booking
                        <FaChevronDown className={`text-xs transition-transform ${bookingDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {bookingDropdown && (
                        <div className="bg-dark-700/50 rounded pl-4 space-y-2">
                          <button
                            onClick={() => {
                              handleBookingSelect('/studios')
                              setOpen(false)
                            }}
                            className="block w-full text-left text-gray-300 hover:text-primary-300 px-3 py-2 text-sm"
                          >
                            📚 Booking Studio
                          </button>
                          <button
                            onClick={() => {
                              handleBookingSelect('/event-request')
                              setOpen(false)
                            }}
                            className="block w-full text-left text-gray-300 hover:text-primary-300 px-3 py-2 text-sm"
                          >
                            🎤 Request Event
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <Link to="/dashboard" className="block text-gray-300 hover:text-white text-sm" onClick={() => setOpen(false)}>Dashboard</Link>
                    <Link to="/bookings" className="block text-gray-300 hover:text-white text-sm" onClick={() => setOpen(false)}>Riwayat</Link>
                  </>
                )}
                <div className="pt-2 border-t border-dark-700">
                  <div className="text-sm text-gray-400 mb-2">👤 {user.nama}</div>
                  <button onClick={() => {
                    handleLogout()
                    setOpen(false)
                  }} className="block text-red-400 text-sm hover:text-red-300">Logout</button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-gray-300 hover:text-white text-sm" onClick={() => setOpen(false)}>Masuk</Link>
                <Link to="/register" className="block text-primary-400 text-sm" onClick={() => setOpen(false)}>Daftar</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
