import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { paymentService, eventPaymentService } from '../../services'
import toast from 'react-hot-toast'
import { FaCheck, FaTimes, FaImage, FaSearch, FaExternalLinkAlt } from 'react-icons/fa'

const STATUS_FILTERS = ['all','pending','verified','rejected']

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

// URL helper – konversi path relatif uploads ke URL yang bisa diakses browser
// Vite dev server sudah proxy /uploads → http://localhost:5000/uploads
const getImageUrl = (path) => {
  if (!path) return null
  // Jika sudah absolute URL, gunakan langsung
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  // Pastikan ada leading slash
  return path.startsWith('/') ? path : `/${path}`
}

// Modal untuk reject pembayaran dengan catatan
function RejectPaymentModal({ payment, onConfirm, onCancel, isLoading }) {
  const [catatan, setCatatan] = useState('')

  const handleSubmit = () => {
    if (!catatan.trim()) {
      toast.error('Catatan penolakan harus diisi')
      return
    }
    onConfirm(payment.id_payment, catatan)
    setCatatan('')
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-white mb-4">Tolak Pembayaran</h2>
        <p className="text-gray-400 mb-4">
          <strong>{payment.nama_customer}</strong> • <strong>{payment.reference_name || payment.nama_studio || payment.nama_event}</strong>
        </p>
        
        <label className="block mb-2 text-sm font-medium text-gray-300">
          Alasan Penolakan *
        </label>
        <textarea
          value={catatan}
          onChange={e => setCatatan(e.target.value)}
          placeholder="Jelaskan alasan penolakan pembayaran..."
          className="w-full bg-dark-700 border border-dark-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 mb-4 resize-none"
          rows="4"
        />
        
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-dark-700 text-white rounded-lg font-medium hover:bg-dark-600 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Memproses...' : 'Tolak Pembayaran'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal pratinjau bukti transfer
function ImagePreviewModal({ src, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <p className="text-white font-medium">Bukti Transfer</p>
          <div className="flex gap-2">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary-400 hover:text-primary-300 text-sm"
            >
              <FaExternalLinkAlt /> Buka di tab baru
            </a>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-sm px-3 py-1 bg-dark-700 rounded-lg"
            >
              Tutup
            </button>
          </div>
        </div>
        <div className="max-h-[75vh] overflow-auto rounded-xl">
          <img
            src={src}
            alt="Bukti Transfer"
            className="w-full object-contain rounded-xl"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <div
            className="hidden items-center justify-center h-40 bg-dark-700 rounded-xl text-gray-400 text-sm"
          >
            Gagal memuat gambar. <a href={src} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary-400 underline">Coba buka langsung</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ManagePayments() {
  const [searchParams] = useSearchParams()
  const [payments, setPayments] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [metodeFilter, setMetodeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [preview,  setPreview]  = useState(null) // URL gambar yang di-preview
  const [rejectModal, setRejectModal] = useState({ show: false, payment: null })
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const load = () => {
    setLoading(true)
    Promise.allSettled([paymentService.getAll(), eventPaymentService.getAll()])
      .then(([bookingResult, eventResult]) => {
        // Booking payments – tampilkan error hanya jika request gagal total
        let bookingPayments = []
        if (bookingResult.status === 'fulfilled') {
          bookingPayments = (bookingResult.value.data.data || []).map(p => ({
            ...p,
            transaction_type: 'booking',
            id_transaction: `booking-${p.id_payment}`,
            reference_name: p.nama_studio,
          }))
        } else {
          console.error('Gagal fetch booking payments:', bookingResult.reason)
          toast.error('Gagal memuat data pembayaran booking')
        }

        // Event payments – tampilkan error hanya jika request gagal total
        let eventPayments = []
        if (eventResult.status === 'fulfilled') {
          eventPayments = (eventResult.value.data.data || []).map(p => ({
            ...p,
            id_payment: p.id_event_payment,
            transaction_type: 'event',
            id_transaction: `event-${p.id_event_payment}`,
            reference_name: p.nama_event,
          }))
        } else {
          console.error('Gagal fetch event payments:', eventResult.reason)
          toast.error('Gagal memuat data pembayaran event')
        }

        // Gabung dan sort berdasarkan tanggal_payment atau created_at (fallback)
        const merged = [...bookingPayments, ...eventPayments].sort((a, b) => {
          const da = new Date(a.tanggal_payment || a.created_at || 0).getTime()
          const db = new Date(b.tanggal_payment || b.created_at || 0).getTime()
          return db - da
        })

        setPayments(merged)
        setFiltered(merged)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let data = payments
    if (filter !== 'all') data = data.filter(p => p.status_payment === filter)
    if (typeFilter !== 'all') {
      data = data.filter(p => p.transaction_type === typeFilter)
    }
    if (metodeFilter !== 'all') {
      data = data.filter(p => {
        const method = p.metode ? p.metode.toLowerCase() : ''
        return method === metodeFilter.toLowerCase()
      })
    }
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(p =>
        p.nama_customer?.toLowerCase().includes(q) ||
        p.reference_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
      )
    }
    setFiltered(data)
    setCurrentPage(1)
  }, [filter, typeFilter, metodeFilter, search, payments])

  const handleVerify = async (payment, status) => {
    if (!payment) return

    if (status === 'rejected') {
      setRejectModal({ show: true, payment })
      return
    }

    // Konfirmasi sebelum verifikasi
    const confirmed = window.confirm(
      `Verifikasi pembayaran dari ${payment.nama_customer} (${payment.reference_name})?\n\nTindakan ini akan mengkonfirmasi pembayaran.`
    )
    if (!confirmed) return

    setIsProcessing(true)
    try {
      if (payment.transaction_type === 'event') {
        await eventPaymentService.verify(payment.id_payment, { status_payment: status })
      } else {
        await paymentService.verify(payment.id_payment, { status_payment: status })
      }
      toast.success('Pembayaran berhasil diverifikasi!')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memverifikasi pembayaran')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectConfirm = async (id, catatan) => {
    setIsProcessing(true)
    try {
      const payment = rejectModal.payment
      if (payment?.transaction_type === 'event') {
        await eventPaymentService.verify(payment.id_payment, { status_payment: 'rejected', catatan_admin: catatan })
      } else {
        await paymentService.verify(payment.id_payment, { status_payment: 'rejected', catatan_admin: catatan })
      }
      toast.success('Pembayaran berhasil ditolak')
      setRejectModal({ show: false, payment: null })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menolak pembayaran')
    } finally {
      setIsProcessing(false)
    }
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const paginatedData = filtered.slice(startIdx, startIdx + itemsPerPage)

  return (
    <AdminLayout title="Verifikasi Pembayaran">
      {/* Search & Filter */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1 relative w-full">
            <label className="block text-sm text-gray-400 mb-1">Cari</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3.5 text-gray-500 text-sm" />
              <input type="text" placeholder="Cari customer, studio, atau event..."
                value={search} onChange={e => setSearch(e.target.value)} className="input-field w-full pl-9 h-11" />
            </div>
          </div>
          <div className="w-full lg:w-auto">
            <label className="block text-sm text-gray-400 mb-1">Tipe Transaksi</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="input-field h-11 min-w-[140px]"
            >
              <option value="all">Semua Tipe</option>
              <option value="booking">Booking</option>
              <option value="event">Event</option>
            </select>
          </div>
          <div className="w-full lg:w-auto">
            <label className="block text-sm text-gray-400 mb-1">Metode</label>
            <select
              value={metodeFilter}
              onChange={e => setMetodeFilter(e.target.value)}
              className="input-field h-11 min-w-[140px]"
            >
              <option value="all">Semua Metode</option>
              <option value="cash">Cash</option>
              <option value="qris">Qris</option>
            </select>
          </div>
          <div className="w-full lg:w-auto">
            <label className="block text-sm text-gray-400 mb-1">Status</label>
            <div className="flex gap-2 flex-wrap h-11 items-center">
              {STATUS_FILTERS.map(s => (
                <button key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors h-full flex items-center ${
                    filter === s
                      ? 'bg-primary-400 text-dark-900 font-semibold'
                      : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                  }`}
                >
                  {s === 'all' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {preview && (
        <ImagePreviewModal src={preview} onClose={() => setPreview(null)} />
      )}

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  {['#','Customer','Tipe','Referensi','Total','Metode','Bukti','Status','Aksi'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Tidak ada pembayaran ditemukan.</td></tr>
                ) : (
                  paginatedData.map((p, index) => (
                    // Gunakan React.Fragment dengan key (bukan shorthand <>) agar key didukung
                    <tr key={p.id_transaction} className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{startIdx + index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{p.nama_customer}</p>
                        <p className="text-gray-500 text-xs">{p.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            p.transaction_type === 'event'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {p.transaction_type === 'event' ? 'Event' : 'Booking'}
                          </span>
                          {p.transaction_type === 'booking' && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                              p.tipe_pembayaran === 'lunas'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {p.tipe_pembayaran === 'lunas' ? 'Pelunasan' : 'DP'}
                            </span>
                          )}
                          {p.transaction_type === 'event' && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                              p.tipe_pembayaran === 'full_payment'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {p.tipe_pembayaran === 'full_payment' ? 'Pelunasan' : 'DP 50%'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{p.reference_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-primary-400 font-medium">{formatRupiah(p.total_harga)}</p>
                        {p.transaction_type === 'booking' && (
                          <p className="text-gray-500 text-xs">
                            Bayar: <span className="text-gray-300 font-semibold">{p.tipe_pembayaran === 'lunas' ? formatRupiah(p.total_harga) : formatRupiah(20000)}</span>
                          </p>
                        )}
                        {p.transaction_type === 'event' && (
                          <p className="text-gray-500 text-xs">
                            Bayar: <span className="text-gray-300 font-semibold">{formatRupiah(p.jumlah_bayar)}</span>
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300 capitalize">{p.metode || <span className="text-gray-600 italic text-xs">–</span>}</td>
                      <td className="px-4 py-3">
                        {p.bukti_transfer ? (
                          <button
                            onClick={() => setPreview(getImageUrl(p.bukti_transfer))}
                            className="flex items-center gap-1 text-primary-400 hover:text-primary-300 text-xs"
                          >
                            <FaImage /> Lihat
                          </button>
                        ) : <span className="text-gray-600 text-xs">–</span>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={p.status_payment} /></td>
                      <td className="px-4 py-3">
                        {p.status_payment === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleVerify(p, 'verified')}
                              disabled={isProcessing}
                              className="btn-success text-xs py-1 px-2 flex items-center gap-1 disabled:opacity-50"
                            >
                              <FaCheck /> Verifikasi
                            </button>
                            <button
                              onClick={() => handleVerify(p, 'rejected')}
                              disabled={isProcessing}
                              className="btn-danger text-xs py-1 px-2 flex items-center gap-1 disabled:opacity-50"
                            >
                              <FaTimes /> Tolak
                            </button>
                          </div>
                        )}
                        {p.status_payment === 'rejected' && p.catatan_admin && (
                          <div className="text-xs text-red-400 max-w-[180px] truncate" title={p.catatan_admin}>
                            📌 {p.catatan_admin}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between mt-6 px-4">
              <span className="text-sm text-gray-400">
                Menampilkan {Math.min(startIdx + 1, filtered.length)}–{Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} data
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-dark-700 text-gray-400 rounded-lg font-medium hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Sebelumnya
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-primary-400 text-dark-900'
                          : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-dark-700 text-gray-400 rounded-lg font-medium hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Selanjutnya →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      {rejectModal.show && rejectModal.payment && (
        <RejectPaymentModal
          payment={rejectModal.payment}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectModal({ show: false, payment: null })}
          isLoading={isProcessing}
        />
      )}

    </AdminLayout>
  )
}
