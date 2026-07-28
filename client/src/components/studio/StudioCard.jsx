import { Link } from 'react-router-dom'
import { FaMapMarkerAlt, FaClock, FaStar, FaArrowRight } from 'react-icons/fa'
import { getImageUrl } from '../../utils/imageUrl'

const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

/**
 * Component Kartu Informasi Studio (StudioCard)
 * 
 * @description
 * Kartu ringkasan informasi studio musik, termasuk foto, status ketersediaan,
 * fasilitas utama, harga per jam, dan tombol action untuk booking.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.studio - Data studio terpilh (id_studio, nama_studio, harga_per_jam, status, foto, deskripsi, fasilitas)
 * @returns {React.ReactElement} StudioCard element
 */
export default function StudioCard({ studio }) {
  return (
    <div className="card hover:border-primary-400/60 transition-all duration-300 group flex flex-col hover:shadow-2xl hover:shadow-primary-400/20 hover:scale-105 cursor-pointer">
      {/* Image placeholder */}
      <div className="relative h-44 bg-gradient-to-br from-primary-900/40 to-dark-700 rounded-lg mb-4 overflow-hidden group-hover:from-primary-900/60 group-hover:to-dark-700 transition-all">
        {studio.foto ? (
          <img src={getImageUrl(studio.foto)} alt={studio.nama_studio}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-primary-700/50 group-hover:text-primary-600/80 transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
        )}
        {/* Status badge */}
        <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold animate-pulse ${
          studio.status === 'aktif'
            ? 'bg-green-500/30 text-green-200 border border-green-500/50 shadow-lg shadow-green-500/20'
            : 'bg-red-500/30 text-red-200 border border-red-500/50 shadow-lg shadow-red-500/20'
        }`}>
          {studio.status === 'aktif' ? '✓ Tersedia' : '✕ Tidak Tersedia'}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary-300 transition-colors">
          {studio.nama_studio}
        </h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2 group-hover:text-gray-300 transition-colors">
          {studio.deskripsi || 'Studio musik profesional dengan fasilitas lengkap.'}
        </p>

        {/* Fasilitas */}
        {studio.fasilitas && (
          <div className="flex flex-wrap gap-1 mb-3">
            {studio.fasilitas.split(',').slice(0, 3).map((f, i) => (
              <span key={i} className="px-2 py-0.5 bg-dark-700 rounded text-xs text-gray-400 border border-dark-600 group-hover:border-primary-400/50 group-hover:bg-dark-700/80 transition-all">
                {f.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 text-primary-300 font-bold text-xl mb-1 group-hover:text-primary-200 transition-colors">
          {formatRupiah(studio.harga_per_jam)}
          <span className="text-gray-500 text-sm font-normal">/ jam</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-dark-700 group-hover:border-primary-400/30 transition-colors">
        {studio.status === 'aktif' && (
          <Link
            to={`/booking/${studio.id_studio}`}
            className="w-full btn-primary text-sm text-center py-2 flex items-center justify-center gap-1"
          >
            Booking Sekarang <FaArrowRight className="text-xs" />
          </Link>
        )}
        {studio.status !== 'aktif' && (
          <button
            disabled
            className="w-full btn-secondary text-sm text-center py-2 opacity-50 cursor-not-allowed"
          >
            Tidak Tersedia
          </button>
        )}
      </div>
    </div>
  )
}
