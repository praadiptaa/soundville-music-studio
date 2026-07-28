import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Public Pages
import Home          from './pages/Home'
import Login         from './pages/Login'
import Register      from './pages/Register'
import StudioList    from './pages/StudioList'
import Contact       from './pages/Contact'

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard'
import BookingPage       from './pages/customer/BookingPage'
import PaymentPage       from './pages/customer/PaymentPage'
import BookingHistory    from './pages/customer/BookingHistory'
import EventRequest      from './pages/customer/EventRequest'
import EventStatus       from './pages/customer/EventStatus'
import EventPaymentPage  from './pages/customer/EventPaymentPage'

// Admin Pages
import AdminDashboard        from './pages/admin/AdminDashboard'
import ManageStudios         from './pages/admin/ManageStudios'
import ManageBookings        from './pages/admin/ManageBookings'
import ManagePayments        from './pages/admin/ManagePayments'
import ManageEvents          from './pages/admin/ManageEvents'
import ManageEventPackages   from './pages/admin/ManageEventPackages'
import ManageEventEquipment  from './pages/admin/ManageEventEquipment'
import ManageUsers           from './pages/admin/ManageUsers'
import Reports               from './pages/admin/Reports'

/**
 * @module client/App
 * @description Root component untuk client app yang mengatur routing utama dan route guards (Private & Admin)
 */

/**
 * Route guard untuk halaman khusus Customer
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Halaman tujuan
 * @returns {React.ReactElement} Halaman jika authorized, atau redirect ke login
 */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-400" /></div>
  return user ? children : <Navigate to="/login" replace />
}

/**
 * Route guard untuk halaman khusus Admin
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Halaman tujuan
 * @returns {React.ReactElement} Halaman jika authorized, atau redirect ke login/dashboard
 */
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-400" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

/**
 * Main App Component
 * @returns {React.ReactElement} Root router wrapper
 */
function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"                  element={<Home />} />
      <Route path="/login"             element={<Login />} />
      <Route path="/register"          element={<Register />} />
      <Route path="/contact"           element={<Contact />} />
      
      {/* Studio pages */}
      <Route path="/studios"           element={<StudioList />} />

      {/* Customer */}
      <Route path="/dashboard"         element={<PrivateRoute><CustomerDashboard /></PrivateRoute>} />
      <Route path="/booking/:id"       element={<PrivateRoute><BookingPage /></PrivateRoute>} />
      <Route path="/payment/:id"       element={<PrivateRoute><PaymentPage /></PrivateRoute>} />
      <Route path="/bookings"          element={<PrivateRoute><BookingHistory /></PrivateRoute>} />
      <Route path="/event-request"     element={<PrivateRoute><EventRequest /></PrivateRoute>} />
      <Route path="/events"            element={<PrivateRoute><EventStatus /></PrivateRoute>} />
      <Route path="/event-payment/:id" element={<PrivateRoute><EventPaymentPage /></PrivateRoute>} />

      {/* Admin */}
      <Route path="/admin"                    element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/studios"            element={<AdminRoute><ManageStudios /></AdminRoute>} />
      <Route path="/admin/bookings"           element={<AdminRoute><ManageBookings /></AdminRoute>} />
      <Route path="/admin/payments"           element={<AdminRoute><ManagePayments /></AdminRoute>} />
      <Route path="/admin/events"             element={<AdminRoute><ManageEvents /></AdminRoute>} />
      <Route path="/admin/event-packages"     element={<AdminRoute><ManageEventPackages /></AdminRoute>} />
      <Route path="/admin/event-equipment"    element={<AdminRoute><ManageEventEquipment /></AdminRoute>} />
      <Route path="/admin/users"              element={<AdminRoute><ManageUsers /></AdminRoute>} />
      <Route path="/admin/reports"            element={<AdminRoute><Reports /></AdminRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
