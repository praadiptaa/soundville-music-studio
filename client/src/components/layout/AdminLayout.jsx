import Sidebar from './Sidebar'

/**
 * Component Layout Halaman Admin
 * 
 * @description
 * Wrapper layout untuk seluruh halaman panel administrasi yang menyertakan navigasi sidebar
 * dan area konten utama yang responsif.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Konten halaman admin
 * @param {string} [props.title] - Judul halaman yang ditampilkan di atas konten
 * @returns {React.ReactElement} AdminLayout element
 */
export default function AdminLayout({ children, title }) {
  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {title && (
            <h1 className="text-2xl font-bold text-white mb-6">{title}</h1>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
