import { useState } from 'react'
import Sidebar from './Sidebar'
import { FaBars } from 'react-icons/fa'

/**
 * Component Layout Halaman Admin & Operator (100% Responsif untuk Mobile, iPad, Tablet, & Desktop)
 */
export default function AdminLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-dark-900 text-white">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-dark-800 border-b border-dark-700 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-dark-700 hover:bg-dark-600 text-primary-400 rounded-lg text-lg transition-colors focus:outline-none"
              aria-label="Buka Menu Sidebar"
            >
              <FaBars />
            </button>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Soundville" className="h-7 object-contain" />
              <span className="font-bold text-white text-sm truncate max-w-[150px] sm:max-w-none">
                {title || 'Soundville Panel'}
              </span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {title && (
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 hidden lg:block">
              {title}
            </h1>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
