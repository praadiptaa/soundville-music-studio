import { useState, useEffect } from 'react'
import Navbar from '../../components/layout/Navbar'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { eventService } from '../../services'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FaStar, FaCalendarAlt, FaMapMarkerAlt, FaInfoCircle, FaTimes, FaMoneyBill } from 'react-icons/fa'

// Modal untuk cancel event dengan catatan
function CancelEventModal({ event, onConfirm, onCancel, isLoading }) {
  const [catatan, setCatatan] = useState('')

  const handleSubmit = () => {
    if (!catatan.trim()) {
      toast.error('Catatan pembatalan harus diisi')
      return
    }
    onConfirm(event.id_event, catatan)
    setCatatan('')
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-white mb-4">Batalkan Event</h2>
        <p className="text-gray-400 mb-4">
          <strong>{event.nama_event}</strong>
        </p>
        
        <label className="block mb-2 text-sm font-medium text-gray-300">
          Alasan Pembatalan *
        </label>
        <textarea
          value={catatan}
          onChange={e => setCatatan(e.target.value)}
          placeholder="Jelaskan alasan Anda membatalkan event..."
          className="w-full bg-dark-700 border border-dark-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 mb-4 resize-none"
          rows="4"
        />
        
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-dark-700 text-white rounded-lg font-medium hover:bg-dark-600 transition-colors disabled:opacity-50"
          >
            Lanjut
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Membatalkan...' : 'Batalkan Event'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EventStatus() {
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelModal, setCancelModal] = useState({ show: false, event: null })
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = () => {
    setLoading(true)
    eventService.getMy()
      .then(({ data }) => setEvents(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleCancelClick = (event) => {
    // Hanya pending/approved yang bisa di-cancel
    if (!['pending', 'approved'].includes(event.status_event)) {
      toast.error(`Event dengan status ${event.status_event} tidak bisa dibatalkan`)
      return
    }
    setCancelModal({ show: true, event })
  }

  const handleCancelConfirm = async (id, catatan) => {
    setIsProcessing(true)
    try {
      await eventService.cancel(id, catatan)
      toast.success('Event berhasil dibatalkan')
      setCancelModal({ show: false, event: null })
      loadEvents()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan event')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Event Saya</h1>
          <Link to="/event-request" className="btn-primary text-sm">+ Request Event</Link>
        </div>

        {loading ? <LoadingSpinner /> : events.length === 0 ? (
          <div className="text-center py-20">
            <FaStar className="text-5xl text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Belum ada request event.</p>
            <Link to="/event-request" className="btn-primary">Request Event Sekarang</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(e => (
              <div key={e.id_event} className="card">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <p className="font-semibold text-white text-lg">{e.nama_event}</p>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt className="text-xs" />
                        {e.tanggal_event?.split('T')[0] || e.tanggal_event}
                      </span>
                      {e.lokasi_event && (
                        <span className="flex items-center gap-1">
                          <FaMapMarkerAlt className="text-xs" />
                          {e.lokasi_event}
                        </span>
                      )}
                    </div>
                    {e.deskripsi && <p className="text-gray-500 text-sm mt-2">{e.deskripsi}</p>}
                    
                    {/* Rejection note */}
                    {e.status_event === 'rejected' && e.catatan_admin && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex gap-2 items-start">
                          <FaInfoCircle className="text-red-500 text-sm flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-red-400 mb-1">Alasan Penolakan</p>
                            <p className="text-sm text-red-300">{e.catatan_admin}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cancel note */}
                    {e.status_event === 'cancelled' && e.catatan_cancel && (
                      <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex gap-2 items-start">
                          <FaInfoCircle className="text-yellow-500 text-sm flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-yellow-400 mb-1">Alasan Pembatalan</p>
                            <p className="text-sm text-yellow-300">{e.catatan_cancel}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={e.status_event} />
                    {e.status_payment && (
                      <span className="text-xs text-gray-500">
                        Bayar: <StatusBadge status={e.status_payment} />
                        {e.status_payment === 'verified' && (
                          <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            e.tipe_pembayaran === 'full_payment'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {e.tipe_pembayaran === 'full_payment' ? 'Lunas' : 'DP 50%'}
                          </span>
                        )}
                      </span>
                    )}
                    {e.status_event === 'approved' && (!e.status_payment || e.status_payment === 'rejected') && (
                      <Link
                        to={`/event-payment/${e.id_event}`}
                        className="btn-primary text-sm flex items-center gap-1 whitespace-nowrap"
                      >
                        <FaMoneyBill /> {e.status_payment === 'rejected' ? 'Bayar Ulang' : 'Bayar DP / Lunas'}
                      </Link>
                    )}
                    {e.status_event === 'confirmed' && e.tipe_pembayaran === 'dp' && !e.metode && (
                      <Link
                        to={`/event-payment/${e.id_event}`}
                        className="btn-primary text-sm flex items-center gap-1 bg-green-600 hover:bg-green-700 whitespace-nowrap"
                      >
                        Pelunasan <FaMoneyBill className="text-xs" />
                      </Link>
                    )}
                    {['pending', 'approved'].includes(e.status_event) && (
                      <button
                        onClick={() => handleCancelClick(e)}
                        className="btn-danger text-sm flex items-center gap-1 whitespace-nowrap"
                      >
                        <FaTimes /> Batalkan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancel Modal */}
        {cancelModal.show && cancelModal.event && (
          <CancelEventModal
            event={cancelModal.event}
            onConfirm={handleCancelConfirm}
            onCancel={() => setCancelModal({ show: false, event: null })}
            isLoading={isProcessing}
          />
        )}
      </div>
    </div>
  )
}
