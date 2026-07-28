import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { bookingService } from '../../services'
import toast from 'react-hot-toast'
import { FaCalendarAlt, FaClock, FaBuilding, FaArrowRight, FaInfoCircle, FaTimes } from 'react-icons/fa'

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

// Modal untuk cancel booking dengan catatan
function CancelModal({ booking, onConfirm, onCancel, isLoading }) {
  const [catatan, setCatatan] = useState('')

  const handleSubmit = () => {
    if (!catatan.trim()) {
      toast.error('Catatan pembatalan harus diisi')
      return
    }
    onConfirm(booking.id_booking, catatan)
    setCatatan('')
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-white mb-4">Batalkan Booking</h2>
        <p className="text-gray-400 mb-4">
          <strong>{booking.nama_studio}</strong>
        </p>
        
        <label className="block mb-2 text-sm font-medium text-gray-300">
          Alasan Pembatalan *
        </label>
        <textarea
          value={catatan}
          onChange={e => setCatatan(e.target.value)}
          placeholder="Jelaskan alasan Anda membatalkan booking..."
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
            {isLoading ? 'Membatalkan...' : 'Batalkan Booking'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BookingHistory() {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [cancelModal, setCancelModal] = useState({ show: false, booking: null })
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = () => {
    setLoading(true)
    bookingService.getMy()
      .then(({ data }) => setBookings(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleCancelClick = (booking) => {
    // Hanya pending/confirmed yang bisa di-cancel
    if (!['pending', 'confirmed'].includes(booking.status_booking)) {
      toast.error(`Booking dengan status ${booking.status_booking} tidak bisa dibatalkan`)
      return
    }
    setCancelModal({ show: true, booking })
  }

  const handleCancelConfirm = async (id, catatan) => {
    setIsProcessing(true)
    try {
      await bookingService.cancel(id, catatan)
      toast.success('Booking berhasil dibatalkan')
      setCancelModal({ show: false, booking: null })
      loadBookings()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan booking')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-6">Riwayat Booking</h1>

        {loading ? <LoadingSpinner text="Memuat booking..." /> : bookings.length === 0 ? (
          <div className="text-center py-20">
            <FaCalendarAlt className="text-5xl text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Belum ada booking.</p>
            <Link to="/studios" className="btn-primary">Booking Sekarang</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => (
              <div key={b.id_booking} className="card">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Studio icon */}
                  <div className="w-12 h-12 bg-primary-400/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FaBuilding className="text-primary-400 text-lg" />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="font-semibold text-white">{b.nama_studio}</p>
                      <StatusBadge status={b.status_booking} />
                    </div>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt className="text-xs" />
                        {b.tanggal?.split('T')[0] || b.tanggal}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaClock className="text-xs" />
                        {b.jam_mulai?.substring(0,5)} – {b.jam_selesai?.substring(0,5)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-primary-400 font-semibold">{formatRupiah(b.total_harga)}</span>
                      <div className="flex items-center gap-2 text-xs">
                        {b.status_payment && (
                          <span className="text-gray-500">Bayar: <StatusBadge status={b.status_payment} /></span>
                        )}
                      </div>
                    </div>

                    {/* Rejection note */}
                    {b.status_booking === 'rejected' && b.catatan_admin && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex gap-2 items-start">
                          <FaInfoCircle className="text-red-500 text-sm flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-red-400 mb-1">Alasan Penolakan Booking</p>
                            <p className="text-sm text-red-300">{b.catatan_admin}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment rejection note */}
                    {b.status_payment === 'rejected' && b.catatan_payment && (
                      <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <div className="flex gap-2 items-start">
                          <FaInfoCircle className="text-orange-500 text-sm flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-orange-400 mb-1">Alasan Penolakan Pembayaran</p>
                            <p className="text-sm text-orange-300">{b.catatan_payment}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cancel note */}
                    {b.status_booking === 'cancelled' && b.catatan_cancel && (
                      <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex gap-2 items-start">
                          <FaInfoCircle className="text-yellow-500 text-sm flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-yellow-400 mb-1">Alasan Pembatalan</p>
                            <p className="text-sm text-yellow-300">{b.catatan_cancel}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex gap-2 flex-wrap">
                    {b.status_booking === 'pending' && (!b.bukti_transfer || b.status_payment === 'rejected') && (
                      <>
                        <Link to={`/payment/${b.id_booking}`} className="btn-primary text-sm flex items-center gap-1 whitespace-nowrap">
                          Upload Bukti <FaArrowRight className="text-xs" />
                        </Link>
                        <button
                          onClick={() => handleCancelClick(b)}
                          className="btn-danger text-sm flex items-center gap-1 whitespace-nowrap"
                        >
                          <FaTimes /> Batalkan
                        </button>
                      </>
                    )}
                    {b.status_booking === 'confirmed' && (
                      <>
                        {b.tipe_pembayaran === 'dp' && !b.metode && (
                          <Link to={`/payment/${b.id_booking}`} className="btn-primary text-sm flex items-center gap-1 bg-green-600 hover:bg-green-700 whitespace-nowrap">
                            Pelunasan <FaArrowRight className="text-xs" />
                          </Link>
                        )}
                        <button
                          onClick={() => handleCancelClick(b)}
                          className="btn-danger text-sm flex items-center gap-1 whitespace-nowrap"
                        >
                          <FaTimes /> Batalkan
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancel Modal */}
        {cancelModal.show && cancelModal.booking && (
          <CancelModal
            booking={cancelModal.booking}
            onConfirm={handleCancelConfirm}
            onCancel={() => setCancelModal({ show: false, booking: null })}
            isLoading={isProcessing}
          />
        )}
      </div>
    </div>
  )
}
